import { Request, Response } from 'express';
import { settingsCollection, GlobalSettings } from './settings.model.js';
import { logAudit } from '../audit/index.js';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';

const DEFAULT_SETTINGS: GlobalSettings = {
  _id: 'global',
  adsenseEnabled: false,
  adsenseClientId: '',
  commentBlocklist: [],
  updatedAt: new Date()
};

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await settingsCollection().findOne({ _id: 'global' });
    if (!settings) {
      res.status(200).json(DEFAULT_SETTINGS);
      return;
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { adsenseEnabled, adsenseClientId, commentBlocklist } = req.body;
    
    // Validations can be done via schema, but we will ensure valid data structure here
    const updateData: Partial<GlobalSettings> = {
      updatedAt: new Date()
    };
    
    if (typeof adsenseEnabled === 'boolean') updateData.adsenseEnabled = adsenseEnabled;
    if (typeof adsenseClientId === 'string') updateData.adsenseClientId = adsenseClientId;
    if (Array.isArray(commentBlocklist)) updateData.commentBlocklist = commentBlocklist.map(s => String(s).trim()).filter(Boolean);

    const result = await settingsCollection().findOneAndUpdate(
      { _id: 'global' },
      { $set: updateData },
      { upsert: true, returnDocument: 'after' }
    );

    if (req.user) {
      await logAudit('update', 'Settings', 'global', req.user.userId, JSON.stringify(updateData), {
        userName: req.user.email,
        userEmail: req.user.email
      });
    }

    res.status(200).json(result || { ...DEFAULT_SETTINGS, ...updateData });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
};

export const getPublicSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await settingsCollection().findOne({ _id: 'global' });
    if (!settings) {
      res.status(200).json({
        adsenseEnabled: DEFAULT_SETTINGS.adsenseEnabled,
        adsenseClientId: DEFAULT_SETTINGS.adsenseClientId
      });
      return;
    }
    res.status(200).json({
      adsenseEnabled: settings.adsenseEnabled,
      adsenseClientId: settings.adsenseClientId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public settings' });
  }
};
