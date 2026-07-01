import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const auditLogSchema = new Schema({
    action: { type: String, enum: ['create', 'update', 'delete', 'restore', 'publish', 'login', 'other'], required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: false, index: true },
    userId: { type: Schema.Types.ObjectId, required: false, index: true },
    userName: { type: String, required: false },
    userEmail: { type: String, required: false },
    details: { type: String, required: false },
    ipAddress: { type: String, required: false },
}, {
    collection: 'audit_logs',
    versionKey: false,
    timestamps: true
});
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
const auditLogsCollection = () => createCollectionAdapter(AuditLogModel);
export { auditLogsCollection };
