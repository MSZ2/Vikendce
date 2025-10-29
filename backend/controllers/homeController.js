const Cottage = require('../models/Cottage');
const Booking = require('../models/Booking');
const User = require('../models/User');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const determineNightlyRate = (cottage, date) => {
  if(cottage.pricePerNight) {
    return cottage.pricePerNight;
  }

  const month = date.getUTCMonth() + 1;

  const isSummer = [6, 7, 8].includes(month);
  const isWinter = [12, 1, 2].includes(month);

  if(isSummer && cottage.priceSummer) {
    return cottage.priceSummer;
  }

  if(isWinter && cottage.priceWinter) {
    return cottage.priceWinter;
  }

  if(cottage.priceSummer && cottage.priceWinter) {
    return Math.round(((cottage.priceSummer + cottage.priceWinter) / 2) * 100) / 100;
  }

  return cottage.priceSummer || cottage.priceWinter || 0;
};

const calculateTotalPriceForStay = (cottage, startDate, nights) => {
  let total = 0;
  for(let i = 0; i < nights; i++) {
    const currentNight = new Date(startDate.getTime() + i * MS_PER_DAY);
    total += determineNightlyRate(cottage, currentNight);
  }
  return Math.round(total * 100) / 100;
};

const hasBlockedDatesWithinRange = (blockedDates = [], startDate, endDate) => {
  if(!blockedDates.length) {
    return false;
  }

  return blockedDates.some(dateValue => {
    const blocked = new Date(dateValue);
    return blocked >= startDate && blocked < endDate;
  });
};

exports.getHomeStats = async (req, res) => {
  const totalCottages = await Cottage.countDocuments();
  const totalOwners = await User.countDocuments({ role: 'owner' });
  const totalTourists = await User.countDocuments({ role: 'tourist' });
  const now = new Date();
  const reserved24h = await Booking.countDocuments({ createdAt: { $gte: new Date(now-24*60*60*1000) } });
  const reserved7d = await Booking.countDocuments({ createdAt: { $gte: new Date(now-7*24*60*60*1000) } });
  const reserved30d = await Booking.countDocuments({ createdAt: { $gte: new Date(now-30*24*60*60*1000) } });

  const cottages = await Cottage.find();

  res.json({ totalCottages, totalOwners, totalTourists, reserved24h, reserved7d, reserved30d, cottages });
};

exports.getCottages = async (req, res) => {
  const { name, location, sortBy, sortOrder } = req.query;
  const query = {};
  if(name) query.name = { $regex: name, $options: 'i' };
  if(location) query.location = { $regex: location, $options: 'i' };
  const sort = sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : undefined;

  let cottageQuery = Cottage.find(query);
  if(sort) {
    cottageQuery = cottageQuery.sort(sort);
  }

  const cottages = await cottageQuery.lean();

  const ratingAgg = await Booking.aggregate([
    { $match: { rating: { $exists: true, $ne: null } } },
    { $group: { _id: '$cottage', avgRating: { $avg: '$rating' } } }
  ]);

  const ratingMap = new Map(ratingAgg.map(r => [r._id.toString(), Number(r.avgRating.toFixed(2))]));

  const cottagesWithRatings = cottages.map(cottage => ({
    ...cottage,
    avgRating: ratingMap.get(cottage._id.toString()) ?? null
  }));

  res.json(cottagesWithRatings);
};

exports.getCottageDetails = async (req, res) => {
  const cottage = await Cottage.findById(req.params.id).populate('owner','username');
  const reviews = await Booking.find({ cottage: req.params.id, rating: { $exists: true } })
    .populate('tourist','username').select('rating comment tourist createdAt');

  let avgRating = null;
  if(reviews.length) avgRating = reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length;

  res.json({ cottage, reviews, avgRating });
};

exports.scheduleBooking = async (req, res) => {
  try {
    const cottageId = req.params.id;
    const userId = req.user.id;
    const { startDate, endDate, adults, children, cardNumber, note } = req.body;

    if(req.user.role !== 'tourist') {
      return res.status(403).json({ message: 'Само туристи могу да поднесу захтев за резервацију.' });
    }

  const cottage = await Cottage.findById(cottageId);
  if(!cottage) {
    return res.status(404).json({ message: 'Викендица није пронађена.' });
  }

  if(cottage.blockedUntil && cottage.blockedUntil > new Date()) {
    return res.status(400).json({ message: 'Викендица је тренутно блокирана за резервацију. Покушајте касније.' });
  }

    if(!startDate || !endDate) {
      return res.status(400).json({ message: 'Оба датума су обавезна.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if(Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Датуми нису у исправном формату.' });
    }

    if(end <= start) {
      return res.status(400).json({ message: 'Датум одјаве мора бити после датума пријаве.' });
    }

    if(start < new Date()) {
      return res.status(400).json({ message: 'Није могуће заказати термин у прошлости.' });
    }

    const totalNights = Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);

    const adultsCount = Number(adults) || 0;
    const childrenCount = Number(children) || 0;

    if(adultsCount <= 0) {
      return res.status(400).json({ message: 'Број одраслих мора бити најмање 1.' });
    }

    if(childrenCount < 0) {
      return res.status(400).json({ message: 'Број деце не може бити негативан.' });
    }

    if(note && note.length > 500) {
      return res.status(400).json({ message: 'Напомена може имати највише 500 карактера.' });
    }

    const totalGuests = adultsCount + childrenCount;
    if(cottage.maxGuests && totalGuests > cottage.maxGuests) {
      return res.status(400).json({
        message: `Нема довољно слободног места. Максимални капацитет је ${cottage.maxGuests} гостију, а унето је ${totalGuests}.`
      });
    }

    if(hasBlockedDatesWithinRange(cottage.unavailableDates, start, end)) {
      return res.status(400).json({
        message: 'Викендица не ради у изабраном периоду. Одаберите неки други датум.'
      });
    }

    const overlappingBooking = await Booking.findOne({
      cottage: cottage._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });

    if(overlappingBooking) {
      return res.status(400).json({
        message: `Викендица је већ резервисана у периоду од ${overlappingBooking.startDate.toISOString()} до ${overlappingBooking.endDate.toISOString()}.`
      });
    }

    const digitsOnlyCard = (cardNumber || '').replace(/\D/g, '');
    if(!digitsOnlyCard) {
      return res.status(400).json({ message: 'Број картице је обавезан.' });
    }

    if(digitsOnlyCard.length < 12 || digitsOnlyCard.length > 19) {
      return res.status(400).json({ message: 'Број картице мора имати између 12 и 19 цифара.' });
    }

    const totalPrice = calculateTotalPriceForStay(cottage, start, totalNights);
    const last4 = digitsOnlyCard.slice(-4);

    const booking = await Booking.create({
      cottage: cottage._id,
      tourist: userId,
      startDate: start,
      endDate: end,
      status: 'pending',
      adults: adultsCount,
      children: childrenCount,
      note: note || undefined,
      cardLast4: last4,
      totalPrice,
      createdBy: userId
    });

    res.status(201).json({
      message: `Захтев за резервацију је успешно послат. Укупна цена износи ${totalPrice} RSD за ${totalNights} ноћења. Власник ће потврдити или одбити захтев у наредном периоду.`,
      bookingId: booking._id,
      totalPrice,
      nights: totalNights
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Дошло је до грешке приликом заказивања. Покушајте поново.' });
  }
};
