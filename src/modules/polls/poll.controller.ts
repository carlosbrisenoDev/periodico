import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { pollsCollection, PollDoc } from './poll.model.js';
import { logAudit } from '../audit/index.js';

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

export const createPoll = async (req: Request, res: Response): Promise<void> => {
  const { title, description, imageUrl, allowMultiple, allowOther, active, order, options } = req.body;
  const now = new Date();
  
  const newPoll: PollDoc = {
    _id: new ObjectId(),
    title,
    description: description ?? undefined,
    imageUrl: imageUrl ?? undefined,
    allowMultiple: allowMultiple ?? false,
    allowOther: allowOther ?? false,
    active: active !== undefined ? active : true,
    order: typeof order === 'number' ? order : 0,
    options: (options || []).map((opt: any) => ({
      id: opt.id || new ObjectId().toString(),
      text: opt.text,
      imageUrl: opt.imageUrl ?? undefined,
      votes: typeof opt.votes === 'number' ? opt.votes : 0
    })),
    otherVotes: 0,
    otherResponses: [],
    createdAt: now,
    updatedAt: now
  };

  const result = await pollsCollection().insertOne(newPoll as any);
  
  const responseData = {
    id: result.insertedId.toString(),
    title: newPoll.title,
    description: newPoll.description ?? null,
    imageUrl: newPoll.imageUrl ?? null,
    allowMultiple: newPoll.allowMultiple,
    allowOther: newPoll.allowOther,
    active: newPoll.active,
    order: newPoll.order,
    options: newPoll.options,
    otherVotes: newPoll.otherVotes,
    otherResponses: newPoll.otherResponses,
    createdAt: newPoll.createdAt,
    updatedAt: newPoll.updatedAt
  };

  res.status(201).json(responseData);
  const authReq = req as any;
  void logAudit(
    'create',
    'poll',
    result.insertedId.toString(),
    authReq.user?.userId,
    `Encuesta creada: "${title}"`,
    { userName: authReq.user?.name, userEmail: authReq.user?.email, ipAddress: req.ip }
  );
};

export const listPublicPolls = async (_req: Request, res: Response): Promise<void> => {
  const polls = await pollsCollection().find({ active: true }).sort({ order: 1, createdAt: -1 }).toArray();
  res.status(200).json(
    polls.map((poll) => ({
      id: poll._id.toString(),
      title: poll.title,
      description: poll.description ?? null,
      imageUrl: poll.imageUrl ?? null,
      allowMultiple: poll.allowMultiple ?? false,
      allowOther: poll.allowOther ?? false,
      active: poll.active ?? true,
      order: poll.order ?? 0,
      options: (poll.options || []).map((opt) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl ?? null,
        votes: opt.votes ?? 0
      })),
      otherVotes: poll.otherVotes ?? 0,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt
    }))
  );
};

export const listAdminPolls = async (_req: Request, res: Response): Promise<void> => {
  const polls = await pollsCollection().find({}).sort({ order: 1, createdAt: -1 }).toArray();
  res.status(200).json(
    polls.map((poll) => ({
      id: poll._id.toString(),
      title: poll.title,
      description: poll.description ?? null,
      imageUrl: poll.imageUrl ?? null,
      allowMultiple: poll.allowMultiple ?? false,
      allowOther: poll.allowOther ?? false,
      active: poll.active ?? true,
      order: poll.order ?? 0,
      options: (poll.options || []).map((opt) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl ?? null,
        votes: opt.votes ?? 0
      })),
      otherVotes: poll.otherVotes ?? 0,
      otherResponses: (poll.otherResponses || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 500),
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt
    }))
  );
};

export const getPollById = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid poll id' });
    return;
  }

  const poll = await pollsCollection().findOne({ _id: new ObjectId(id) });
  if (!poll) {
    res.status(404).json({ message: 'Poll not found' });
    return;
  }

  res.status(200).json({
    id: poll._id.toString(),
    title: poll.title,
    description: poll.description ?? null,
    imageUrl: poll.imageUrl ?? null,
    allowMultiple: poll.allowMultiple ?? false,
    allowOther: poll.allowOther ?? false,
    active: poll.active ?? true,
    order: poll.order ?? 0,
    options: (poll.options || []).map((opt) => ({
      id: opt.id,
      text: opt.text,
      imageUrl: opt.imageUrl ?? null,
      votes: opt.votes ?? 0
    })),
    otherVotes: poll.otherVotes ?? 0,
    otherResponses: poll.otherResponses || [],
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt
  });
};

export const updatePoll = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid poll id' });
    return;
  }

  const existing = await pollsCollection().findOne({ _id: new ObjectId(id) });
  if (!existing) {
    res.status(404).json({ message: 'Poll not found' });
    return;
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date()
  };

  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.imageUrl !== undefined) updates.imageUrl = req.body.imageUrl;
  if (req.body.allowMultiple !== undefined) updates.allowMultiple = req.body.allowMultiple;
  if (req.body.allowOther !== undefined) updates.allowOther = req.body.allowOther;
  if (req.body.active !== undefined) updates.active = req.body.active;
  if (req.body.order !== undefined) updates.order = req.body.order;
  if (req.body.options !== undefined) {
    updates.options = (req.body.options || []).map((opt: any) => ({
      id: opt.id || new ObjectId().toString(),
      text: opt.text,
      imageUrl: opt.imageUrl ?? undefined,
      votes: typeof opt.votes === 'number' ? opt.votes : (existing.options.find((o: any) => o.id === opt.id)?.votes || 0)
    }));
  }

  const result = await pollsCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result) {
    res.status(404).json({ message: 'Poll not found' });
    return;
  }

  res.status(200).json({
    id: result._id.toString(),
    title: result.title,
    description: result.description ?? null,
    imageUrl: result.imageUrl ?? null,
    allowMultiple: result.allowMultiple ?? false,
    allowOther: result.allowOther ?? false,
    active: result.active ?? true,
    order: result.order ?? 0,
    options: result.options || [],
    otherVotes: result.otherVotes ?? 0,
    otherResponses: result.otherResponses || [],
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  });

  const authReq = req as any;
  void logAudit(
    'update',
    'poll',
    id,
    authReq.user?.userId,
    `Encuesta actualizada: "${result.title}"`,
    { userName: authReq.user?.name, userEmail: authReq.user?.email, ipAddress: req.ip }
  );
};

export const deletePoll = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid poll id' });
    return;
  }

  const result = await pollsCollection().deleteOne({ _id: new ObjectId(id) });
  if (!result.deletedCount) {
    res.status(404).json({ message: 'Poll not found' });
    return;
  }

  const authReq = req as any;
  void logAudit(
    'delete',
    'poll',
    id,
    authReq.user?.userId,
    `Encuesta eliminada`,
    { userName: authReq.user?.name, userEmail: authReq.user?.email, ipAddress: req.ip }
  );

  res.status(200).json({ message: 'Poll deleted' });
};

export const votePoll = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid poll id' });
    return;
  }

  const poll = await pollsCollection().findOne({ _id: new ObjectId(id) });
  if (!poll || !poll.active) {
    res.status(404).json({ message: 'Encuesta no encontrada o inactiva' });
    return;
  }

  const optionIds = Array.isArray(req.body.optionIds) ? req.body.optionIds : [];
  const otherText = typeof req.body.otherText === 'string' ? req.body.otherText.trim() : '';

  if (optionIds.length === 0 && !otherText) {
    res.status(400).json({ message: 'Debes seleccionar una opción o escribir una respuesta en Otro.' });
    return;
  }

  const countSelected = optionIds.length + (otherText ? 1 : 0);
  if (!poll.allowMultiple && countSelected > 1) {
    res.status(400).json({ message: 'Esta encuesta solo permite elegir una respuesta.' });
    return;
  }

  // Incrementar votos para cada opción seleccionada
  for (const optId of optionIds) {
    await pollsCollection().updateOne(
      { _id: new ObjectId(id), 'options.id': optId },
      { $inc: { 'options.$.votes': 1 }, $set: { updatedAt: new Date() } }
    );
  }

  // Si se envió respuesta en "Otro" y está permitido
  if (otherText && poll.allowOther) {
    await pollsCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { otherVotes: 1 },
        $push: { otherResponses: { text: otherText, createdAt: new Date() } },
        $set: { updatedAt: new Date() }
      } as any
    );
  }

  const updated = await pollsCollection().findOne({ _id: new ObjectId(id) });
  if (!updated) {
    res.status(500).json({ message: 'Error recuperando resultados actualizados' });
    return;
  }

  res.status(200).json({
    id: updated._id.toString(),
    title: updated.title,
    options: (updated.options || []).map((opt) => ({
      id: opt.id,
      text: opt.text,
      imageUrl: opt.imageUrl ?? null,
      votes: opt.votes ?? 0
    })),
    otherVotes: updated.otherVotes ?? 0
  });
};
