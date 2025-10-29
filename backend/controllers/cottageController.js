const path = require('path');
const Cottage = require('../models/Cottage');
const Booking = require('../models/Booking');

const sanitizeArrayField = value => {
  if(Array.isArray(value)) return value.filter(Boolean).map(item => item.toString().trim()).filter(Boolean);
  if(typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

exports.getOwnerCottages = async (req, res) => {
  if(req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Само власници могу приступити овој рути.' });
  }

  const cottages = await Cottage.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(cottages);
};

exports.updateCottage = async (req, res) => {
  if(req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Само власници могу мењати податке о викендици.' });
  }

  const cottage = await Cottage.findOne({ _id: req.params.id, owner: req.user.id });
  if(!cottage) {
    return res.status(404).json({ message: 'Викендица није пронађена.' });
  }

  const {
    name,
    location,
    coordinates,
    images,
    services,
    pricePerNight,
    priceSummer,
    priceWinter,
    phone,
    maxGuests
  } = req.body;

  if(name !== undefined) cottage.name = name;
  if(location !== undefined) cottage.location = location;

  const parsedCoordinates = parseCoordinates(coordinates);
  if(parsedCoordinates !== undefined) {
    cottage.coordinates = parsedCoordinates === null ? undefined : parsedCoordinates;
  }
  if(req.body.lat !== undefined || req.body.lng !== undefined) {
    const lat = req.body.lat === '' ? undefined : Number(req.body.lat);
    const lng = req.body.lng === '' ? undefined : Number(req.body.lng);
    if(Number.isFinite(lat) || Number.isFinite(lng)) {
      cottage.coordinates = {
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined
      };
    }
  }

  const normalizedImages = sanitizeArrayField(images);
  if(normalizedImages !== undefined) cottage.images = normalizedImages;

  const normalizedServices = sanitizeArrayField(services);
  if(normalizedServices !== undefined) cottage.services = normalizedServices;

  if(pricePerNight !== undefined) cottage.pricePerNight = pricePerNight === '' ? undefined : Number(pricePerNight);
  if(priceSummer !== undefined) cottage.priceSummer = Number(priceSummer);
  if(priceWinter !== undefined) cottage.priceWinter = Number(priceWinter);
  if(phone !== undefined) cottage.phone = phone;
  if(maxGuests !== undefined) cottage.maxGuests = maxGuests === '' ? undefined : Number(maxGuests);

  await cottage.save();
  res.json(cottage);
};

const parseCoordinates = (data) => {
  if(data === undefined) return undefined;
  if(data === null || data === '') return null;

  if(typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parseCoordinates(parsed);
    } catch {
      return undefined;
    }
  }

  if(typeof data === 'object') {
    const lat = data.lat === '' || data.lat === undefined ? undefined : Number(data.lat);
    const lng = data.lng === '' || data.lng === undefined ? undefined : Number(data.lng);
    if(Number.isFinite(lat) || Number.isFinite(lng)) {
      return {
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined
      };
    }
  }

  return undefined;
};

exports.createCottage = async (req, res) => {
  if(req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Само власници могу дода(ва)ти викендице.' });
  }

  const {
    name,
    location,
    services,
    pricePerNight,
    priceSummer,
    priceWinter,
    phone,
    maxGuests,
    lat,
    lng,
    coordinates
  } = req.body;

  if(!name || !location) {
    return res.status(400).json({ message: 'Назив и место су обавезни.' });
  }

  if(priceSummer === undefined || priceSummer === '' || !Number.isFinite(Number(priceSummer))) {
    return res.status(400).json({ message: 'Цена за лето је обавезна и мора бити број.' });
  }

  if(priceWinter === undefined || priceWinter === '' || !Number.isFinite(Number(priceWinter))) {
    return res.status(400).json({ message: 'Цена за зиму је обавезна и мора бити број.' });
  }

  const normalizedServices = sanitizeArrayField(services);
  const normalizedImages = (req.files || []).map(file => '/uploads/' + path.basename(file.path));

  const cottageData = {
    owner: req.user.id,
    name,
    location,
    priceSummer: Number(priceSummer),
    priceWinter: Number(priceWinter),
    services: normalizedServices || [],
    images: normalizedImages
  };

  if(pricePerNight !== undefined && pricePerNight !== '' && Number.isFinite(Number(pricePerNight))) {
    cottageData.pricePerNight = Number(pricePerNight);
  }

  if(phone !== undefined) {
    cottageData.phone = phone;
  }

  if(maxGuests !== undefined && maxGuests !== '' && Number.isFinite(Number(maxGuests))) {
    cottageData.maxGuests = Number(maxGuests);
  }

  const coordFromBody = parseCoordinates(coordinates);
  const latNum = lat === undefined || lat === '' ? undefined : Number(lat);
  const lngNum = lng === undefined || lng === '' ? undefined : Number(lng);

  const finalCoords = coordFromBody || (Number.isFinite(latNum) || Number.isFinite(lngNum)
    ? { lat: Number.isFinite(latNum) ? latNum : undefined, lng: Number.isFinite(lngNum) ? lngNum : undefined }
    : undefined);

  if(finalCoords) {
    cottageData.coordinates = finalCoords;
  }

  const cottage = await Cottage.create(cottageData);
  res.status(201).json(cottage);
};

exports.deleteCottage = async (req, res) => {
  if(req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Само власници могу брисати викендице.' });
  }

  const deleted = await Cottage.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if(!deleted) {
    return res.status(404).json({ message: 'Викендица није пронађена.' });
  }

  res.json({ message: 'Викендица је успешно обрисана.' });
};

exports.getAllCottagesForAdmin = async (req, res) => {
  const cottages = await Cottage.find().populate('owner', 'username email').lean();

  const cottageIds = cottages.map(c => c._id);
  const reviews = await Booking.aggregate([
    { $match: { cottage: { $in: cottageIds }, rating: { $exists: true } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$cottage', recentRatings: { $push: '$rating' } } }
  ]);

  const recentMap = new Map(reviews.map(r => [r._id.toString(), r.recentRatings.slice(0, 3)]));

  const enriched = cottages.map(cottage => {
    const ratings = recentMap.get(cottage._id.toString()) || [];
    const flagged = ratings.length === 3 && ratings.every(r => r < 2);
    return { ...cottage, recentRatings: ratings, lowRated: flagged };
  });

  res.json(enriched);
};

exports.blockCottage = async (req, res) => {
  const { id } = req.params;
  const blockedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const cottage = await Cottage.findByIdAndUpdate(id, { blockedUntil }, { new: true });
  if(!cottage) {
    return res.status(404).json({ message: 'Викендица није пронађена.' });
  }

  res.json({ message: 'Викендица је привремено блокирана на 48 сати.', blockedUntil });
};
