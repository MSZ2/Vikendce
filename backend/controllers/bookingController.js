const Booking = require('../models/Booking');
const Cottage = require('../models/Cottage');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toPlainBooking = (bookingDoc) => {
  const booking = { ...bookingDoc };
  if(booking.cottage && booking.cottage._id) {
    booking.cottage = {
      _id: booking.cottage._id,
      name: booking.cottage.name,
      location: booking.cottage.location
    };
  }
  return booking;
};

exports.getTouristBookings = async (req, res) => {
  if(req.user.role !== 'tourist') {
    return res.status(403).json({ message: 'Само туриста може да приступи својим резервацијама.' });
  }

  const userId = req.user.id;
  const now = new Date();

  const bookings = await Booking.find({ tourist: userId })
    .populate('cottage', 'name location')
    .sort({ startDate: 1 })
    .lean();

  const current = [];
  const history = [];

  bookings.forEach(booking => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const isPast = end < now || booking.status === 'cancelled' || booking.status === 'rejected';

    const enriched = toPlainBooking({
      ...booking,
      canCancel: !['cancelled','rejected'].includes(booking.status) && start.getTime() - now.getTime() >= MS_PER_DAY,
      canReview: booking.status === 'approved' && end < now && !booking.rating && !booking.comment
    });

    if(isPast) {
      history.push(enriched);
    } else {
      current.push(enriched);
    }
  });

  history.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  current.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  res.json({ current, history });
};

exports.cancelBooking = async (req, res) => {
  if(req.user.role !== 'tourist') {
    return res.status(403).json({ message: 'Само туриста може да откаже резервацију.' });
  }

  const booking = await Booking.findById(req.params.id);
  if(!booking) {
    return res.status(404).json({ message: 'Резервација није пронађена.' });
  }

  if(String(booking.tourist) !== req.user.id) {
    return res.status(403).json({ message: 'Није дозвољено да откажете туђу резервацију.' });
  }

  if(['cancelled','rejected'].includes(booking.status)) {
    return res.status(400).json({ message: 'Резервација је већ отказана или одбијена.' });
  }

  const now = new Date();
  const start = new Date(booking.startDate);
  if(start.getTime() - now.getTime() < MS_PER_DAY) {
    return res.status(400).json({ message: 'Резервацију је могуће отказати најкасније 24 часа пре почетка.' });
  }

  booking.status = 'cancelled';
  await booking.save();

  res.json({ message: 'Резервација је успешно отказана.' });
};

exports.submitReview = async (req, res) => {
  if(req.user.role !== 'tourist') {
    return res.status(403).json({ message: 'Само туриста може да остави рецензију.' });
  }

  const { rating, comment } = req.body;

  if(!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Оцена мора бити између 1 и 5.' });
  }

  if(comment && comment.length > 500) {
    return res.status(400).json({ message: 'Коментар може имати највише 500 карактера.' });
  }

  const booking = await Booking.findById(req.params.id).populate('cottage');
  if(!booking) {
    return res.status(404).json({ message: 'Резервација није пронађена.' });
  }

  if(String(booking.tourist) !== req.user.id) {
    return res.status(403).json({ message: 'Није дозвољено да оставите рецензију за туђу резервацију.' });
  }

  if(booking.status !== 'approved') {
    return res.status(400).json({ message: 'Рецензију можете оставити само за одобрену резервацију.' });
  }

  const now = new Date();
  const end = new Date(booking.endDate);
  if(end >= now) {
    return res.status(400).json({ message: 'Резервација још увек није завршена.' });
  }

  if(booking.rating || booking.comment) {
    return res.status(400).json({ message: 'Рецензија је већ остављена.' });
  }

  booking.rating = rating;
  booking.comment = comment ? comment.trim() : undefined;
  await booking.save();

  res.json({ message: 'Хвала! Ваша рецензија је успешно забележена.' });
};

exports.getOwnerReservations = async (req, res) => {
  if(req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Само власници могу да виде своје резервације.' });
  }

  const cottages = await Cottage.find({ owner: req.user.id }).select('_id name location');
  if(!cottages.length) {
    return res.json({ pending: [], calendar: [] });
  }

  const cottageIdList = cottages.map(c => c._id);

  const pendingBookings = await Booking.find({ cottage: { $in: cottageIdList }, status: 'pending' })
    .populate('tourist', 'username firstName lastName email phone')
    .populate('cottage', 'name location')
    .sort({ createdAt: -1 })
    .lean();

  const calendarBookings = await Booking.find({ cottage: { $in: cottageIdList }, status: { $in: ['pending', 'approved'] } })
    .populate('tourist', 'username firstName lastName')
    .populate('cottage', 'name location')
    .lean();

  const pending = pendingBookings.map(b => ({
    ...toPlainBooking(b),
    tourist: b.tourist,
    createdAt: b.createdAt,
    note: b.note,
    totalPrice: b.totalPrice
  }));

  const calendar = calendarBookings.map(b => ({
    id: b._id,
    title: `${b.cottage?.name || 'Викендица'} - ${b.tourist?.username || 'Туриста'}`,
    start: b.startDate,
    end: b.endDate,
    status: b.status,
    cottage: b.cottage,
    tourist: b.tourist,
    note: b.note,
    totalPrice: b.totalPrice
  }));

  res.json({ pending, calendar });
};

exports.updateBookingStatus = async (req, res) => {
  if(req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Само власници могу да управљају резервацијама.' });
  }

  const { action, comment } = req.body;
  if(!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Непозната акција.' });
  }

  const booking = await Booking.findById(req.params.id).populate('cottage', 'owner name');
  if(!booking) {
    return res.status(404).json({ message: 'Резервација није пронађена.' });
  }

  if(String(booking.cottage.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Није дозвољено да измените ову резервацију.' });
  }

  if(booking.status !== 'pending') {
    return res.status(400).json({ message: 'Само резервације на чекању могу бити измењене.' });
  }

  if(action === 'approve') {
    booking.status = 'approved';
    booking.ownerComment = comment ? comment.trim() : undefined;
  } else {
    if(!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Коментар је обавезан при одбијању резервације.' });
    }
    booking.status = 'rejected';
    booking.ownerComment = comment.trim();
  }

  await booking.save();

  res.json({
    message: action === 'approve' ? 'Резервација је успешно одобрена.' : 'Резервација је одбијена.',
    status: booking.status,
    ownerComment: booking.ownerComment
  });
};
