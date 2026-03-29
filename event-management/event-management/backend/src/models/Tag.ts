import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  slug: string;
  category: 'topic' | 'type' | 'industry' | 'format';
  usageCount: number;
  trendScore: number;
}

const TagSchema = new Schema<ITag>({
  name:       { type: String, required: true, unique: true, trim: true },
  slug:       { type: String, required: true, unique: true, lowercase: true },
  category:   { type: String, enum: ['topic', 'type', 'industry', 'format'], default: 'topic' },
  usageCount: { type: Number, default: 0 },
  trendScore: { type: Number, default: 0 },
}, { timestamps: true });

export const Tag = mongoose.model<ITag>('Tag', TagSchema);

export interface ITrendingTag extends Document {
  tag: mongoose.Types.ObjectId;
  period: 'hourly' | 'daily' | 'weekly';
  score: number;
  eventCount: number;
  viewCount: number;
  computedAt: Date;
}

const TrendingTagSchema = new Schema<ITrendingTag>({
  tag:        { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  period:     { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
  score:      { type: Number, default: 0 },
  eventCount: { type: Number, default: 0 },
  viewCount:  { type: Number, default: 0 },
  computedAt: { type: Date, default: Date.now },
}, { timestamps: true });

TrendingTagSchema.index({ period: 1, score: -1 });

export const TrendingTag = mongoose.model<ITrendingTag>('TrendingTag', TrendingTagSchema);