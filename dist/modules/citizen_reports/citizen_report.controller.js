import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import { env } from '../../config.js';
import { citizenReportsCollection } from './citizen_report.model.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
const createTransport = () => nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});
export const createCitizenReport = async (req, res) => {
    const { name, email, phone, subject, description, imageUrl } = req.body;
    const now = new Date();
    const result = await citizenReportsCollection().insertOne({
        _id: new ObjectId(),
        name,
        email,
        phone,
        subject,
        description,
        imageUrl,
        status: 'new',
        createdAt: now,
        updatedAt: now
    });
    // Try to send email to the newsroom
    try {
        const transporter = createTransport();
        const from = env.EMAIL_FROM ? `"${env.EMAIL_FROM}" <${env.EMAIL_USER}>` : env.EMAIL_USER;
        const to = env.EMAIL_USER; // Send to the configured admin email
        await transporter.sendMail({
            from,
            to,
            subject: `Nuevo Reporte Ciudadano: ${subject}`,
            html: `
        <h2>Nuevo Reporte Ciudadano</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone || 'N/A'}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Descripción:</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
        ${imageUrl ? `<p><strong>Imagen adjunta:</strong> <a href="${imageUrl}">${imageUrl}</a></p>` : ''}
      `,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`[CitizenReport] Failed to send email: ${message}\n`);
        // We still return 201 because the report was saved to DB successfully
    }
    res.status(201).json({
        id: result.insertedId.toString(),
        name,
        email,
        phone,
        subject,
        description,
        imageUrl,
        status: 'new'
    });
};
export const listCitizenReports = async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) {
        filter.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const reports = await citizenReportsCollection()
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray();
    const total = await citizenReportsCollection().countDocuments(filter);
    res.status(200).json({
        data: reports.map(r => ({
            id: r._id.toString(),
            name: r.name,
            email: r.email,
            phone: r.phone,
            subject: r.subject,
            description: r.description,
            imageUrl: r.imageUrl,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        })),
        meta: {
            total,
            page: Number(page),
            limit: Number(limit)
        }
    });
};
export const updateCitizenReportStatus = async (req, res) => {
    const id = readParam(req.params.id);
    const { status } = req.body;
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid report id' });
        return;
    }
    const result = await citizenReportsCollection().findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!result) {
        res.status(404).json({ message: 'Report not found' });
        return;
    }
    res.status(200).json({
        id: result._id.toString(),
        name: result.name,
        email: result.email,
        phone: result.phone,
        subject: result.subject,
        description: result.description,
        imageUrl: result.imageUrl,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
    });
};
export const deleteCitizenReport = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid report id' });
        return;
    }
    const result = await citizenReportsCollection().deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
        res.status(404).json({ message: 'Report not found' });
        return;
    }
    res.status(200).json({ message: 'Report deleted' });
};
