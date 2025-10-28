const Cottage = require('../models/Cottage');
const Booking = require('../models/Booking');
const User = require('../models/User');

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
  const sort = {};
  if(sortBy) sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const cottages = await Cottage.find(query).sort(sort);
  res.json(cottages);
};

exports.getCottageDetails = async (req, res) => {
  const cottage = await Cottage.findById(req.params.id).populate('owner','username');
  const reviews = await Booking.find({ cottage: req.params.id, rating: { $exists: true } })
    .populate('tourist','username').select('rating comment tourist createdAt');

  let avgRating = null;
  if(reviews.length) avgRating = reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length;

  res.json({ cottage, reviews, avgRating });
};
