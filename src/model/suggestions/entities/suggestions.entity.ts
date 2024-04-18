import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ISuggestions } from '../interfaces/suggestions.interface';

@Schema({ collection: DATABASE_COLLECTION.SUGGESTIONS, timestamps: true })
export class Suggestions extends Model<ISuggestions> {
	@Prop({ required: true, unique: true, trim: true })
		name: string;

	@Prop({ trim: true, type: mongoose.Schema.Types.Mixed })
		condition: any;

	@Prop({ type: mongoose.Schema.Types.Number })
		dateOffset: number;

	@Prop({ type: mongoose.Schema.Types.String })
		collectionName: string;

	@Prop({ type: mongoose.Schema.Types.Boolean })
		display: boolean;

	@Prop({ default: true })
		isActive: boolean;

	@Prop({ default: false })
		isDeleted: boolean;
}

export const SuggestionsSchema = SchemaFactory.createForClass(Suggestions);
SuggestionsSchema.index({ name: 1 });
