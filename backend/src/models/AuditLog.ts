import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      'user.create',
      'user.update',
      'user.delete',
      'user.role.change',
      'interview.create',
      'interview.update',
      'interview.delete',
      'resume.create',
      'resume.delete',
      'payment.create',
      'payment.refund',
      'admin.login',
      'admin.export',
      'bulk.delete',
      'settings.update',
    ],
  },
  resource: {
    type: String,
    required: true,
    index: true,
  },
  resourceId: {
    type: String,
    index: true,
  },
  changes: {
    type: Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
    default: 'success',
  },
  errorMessage: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
