import { Request, Response } from 'express';
import { MongoServerError, ObjectId } from 'mongodb';
import { authorsCollection } from '../author/author.model.js';
import { SocialDoc, SocialPlatform, socialsCollection } from './social.model.js';

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

const platformLabelMap: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  custom: 'Custom'
};

const normalizePlatform = (value: unknown): SocialPlatform | null => {
  if (typeof value !== 'string') {
    return null;
  }

  if (value === 'x') {
    return 'twitter';
  }

  if (value === 'facebook' || value === 'twitter' || value === 'instagram' || value === 'linkedin' || value === 'custom') {
    return value;
  }

  return null;
};

const mapSocialResponse = (social: SocialDoc) => ({
  id: social._id.toString(),
  authorId: social.authorId.toString(),
  platform: social.platform,
  platformLabel: platformLabelMap[social.platform],
  url: social.url,
  label: social.label ?? null,
  createdAt: social.createdAt,
  updatedAt: social.updatedAt
});

const ensureAuthorExists = async (authorId: string, res: Response): Promise<ObjectId | null> => {
  if (!ObjectId.isValid(authorId)) {
    res.status(400).json({ message: 'Invalid author id' });
    return null;
  }

  const author = await authorsCollection().findOne({ _id: new ObjectId(authorId) });
  if (!author) {
    res.status(404).json({ message: 'Author not found' });
    return null;
  }

  return author._id;
};

const findSocialById = async (id: string, res: Response): Promise<SocialDoc | null> => {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid social id' });
    return null;
  }

  const social = await socialsCollection().findOne({ _id: new ObjectId(id) });
  if (!social) {
    res.status(404).json({ message: 'Social not found' });
    return null;
  }

  return social;
};

export const listSocials = async (req: Request, res: Response): Promise<void> => {
  const authorId = readParam(req.query.authorId as string | string[] | undefined);
  const platform = normalizePlatform(readParam(req.query.platform as string | string[] | undefined));

  const filters: Record<string, unknown> = {};

  if (authorId) {
    const authorObjectId = await ensureAuthorExists(authorId, res);
    if (!authorObjectId) {
      return;
    }
    filters.authorId = authorObjectId;
  }

  if (platform) {
    filters.platform = platform;
  }

  const socials = await socialsCollection().find(filters).sort({ createdAt: -1 }).toArray();
  res.status(200).json(socials.map(mapSocialResponse));
};

export const listSocialsByAuthor = async (req: Request, res: Response): Promise<void> => {
  const authorId = readParam(req.params.authorId);
  const authorObjectId = await ensureAuthorExists(authorId, res);
  if (!authorObjectId) {
    return;
  }

  const platform = normalizePlatform(readParam(req.query.platform as string | string[] | undefined));
  const filters: Record<string, unknown> = { authorId: authorObjectId };
  if (platform) {
    filters.platform = platform;
  }

  const socials = await socialsCollection().find(filters).sort({ createdAt: -1 }).toArray();
  res.status(200).json({
    authorId: authorObjectId.toString(),
    total: socials.length,
    items: socials.map(mapSocialResponse)
  });
};

export const getSocialById = async (req: Request, res: Response): Promise<void> => {
  const social = await findSocialById(readParam(req.params.id), res);
  if (!social) {
    return;
  }

  res.status(200).json(mapSocialResponse(social));
};

export const createSocial = async (req: Request, res: Response): Promise<void> => {
  const authorObjectId = await ensureAuthorExists(req.body.authorId, res);
  if (!authorObjectId) {
    return;
  }

  const platform = req.body.platform as SocialPlatform;
  const url = req.body.url as string;
  const label = req.body.label as string | undefined;
  const now = new Date();

  try {
    const result = await socialsCollection().insertOne({
      _id: new ObjectId(),
      authorId: authorObjectId,
      platform,
      url,
      label,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json(
      mapSocialResponse({
        _id: result.insertedId,
        authorId: authorObjectId,
        platform,
        url,
        label,
        createdAt: now,
        updatedAt: now
      })
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Social link already exists' });
      return;
    }
    throw error;
  }
};

export const updateSocial = async (req: Request, res: Response): Promise<void> => {
  const social = await findSocialById(readParam(req.params.id), res);
  if (!social) {
    return;
  }

  const updates: Record<string, unknown> = {};

  if (req.body.authorId !== undefined) {
    const authorObjectId = await ensureAuthorExists(req.body.authorId, res);
    if (!authorObjectId) {
      return;
    }
    updates.authorId = authorObjectId;
  }

  if (req.body.platform !== undefined) {
    updates.platform = req.body.platform;
  }

  if (req.body.url !== undefined) {
    updates.url = req.body.url;
  }

  if (req.body.label !== undefined) {
    updates.label = req.body.label;
  }

  const nextSocial = {
    authorId: (updates.authorId as ObjectId | undefined) ?? social.authorId,
    platform: (updates.platform as SocialPlatform | undefined) ?? social.platform,
    url: (updates.url as string | undefined) ?? social.url,
    label: (updates.label as string | undefined) ?? social.label
  };

  if (nextSocial.platform === 'custom' && !nextSocial.label) {
    res.status(400).json({ message: 'Label is required for custom social links' });
    return;
  }

  updates.updatedAt = new Date();

  try {
    const result = await socialsCollection().findOneAndUpdate(
      { _id: new ObjectId(social._id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      res.status(404).json({ message: 'Social not found' });
      return;
    }

    res.status(200).json(mapSocialResponse(result));
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Social link already exists' });
      return;
    }
    throw error;
  }
};

export const deleteSocial = async (req: Request, res: Response): Promise<void> => {
  const social = await findSocialById(readParam(req.params.id), res);
  if (!social) {
    return;
  }

  const result = await socialsCollection().deleteOne({ _id: social._id });
  if (!result.deletedCount) {
    res.status(404).json({ message: 'Social not found' });
    return;
  }

  res.status(200).json({ message: 'Social deleted' });
};

