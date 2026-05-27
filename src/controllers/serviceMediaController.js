const ServiceMedia = require('../models/ServiceMedia');
const Service = require('../models/Service');

// @desc    Get all service media (Admin)
// @route   GET /api/service-media/admin
// @access  Private/Admin
const getAllServiceMedia = async (req, res) => {
  try {
    const mediaList = await ServiceMedia.find({}).populate('serviceId', 'title category');
    res.json(mediaList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service media by service ID
// @route   GET /api/service-media/:serviceId
// @access  Public
const getServiceMediaByServiceId = async (req, res) => {
  try {
    const media = await ServiceMedia.findOne({ serviceId: req.params.serviceId });
    if (media) {
      res.json(media);
    } else {
      res.status(404).json({ message: 'Media override not found for this service' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Create or update service media override
// @route   POST /api/service-media/admin
// @access  Private/Admin
const upsertServiceMedia = async (req, res) => {
  try {
    const { serviceId, imageUrl, thumbnailUrl, aspectRatio } = req.body;

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    let media = await ServiceMedia.findOne({ serviceId });

    if (media) {
      // Update existing
      media.imageUrl = imageUrl || media.imageUrl;
      media.thumbnailUrl = thumbnailUrl !== undefined ? thumbnailUrl : media.thumbnailUrl;
      media.aspectRatio = aspectRatio || media.aspectRatio;
      await media.save();
    } else {
      // Create new
      media = await ServiceMedia.create({
        serviceId,
        imageUrl,
        thumbnailUrl: thumbnailUrl || '',
        aspectRatio: aspectRatio || '1:1'
      });
    }

    // Also update the Service model's imageUrl directly to keep it in sync automatically!
    service.imageUrl = imageUrl || service.imageUrl;
    await service.save();

    res.json(media);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Delete service media override
// @route   DELETE /api/service-media/admin/:id
// @access  Private/Admin
const deleteServiceMedia = async (req, res) => {
  try {
    const media = await ServiceMedia.findById(req.params.id);

    if (media) {
      await media.deleteOne();
      res.json({ message: 'Service media override deleted successfully' });
    } else {
      res.status(404).json({ message: 'Service media override not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllServiceMedia,
  getServiceMediaByServiceId,
  upsertServiceMedia,
  deleteServiceMedia
};
