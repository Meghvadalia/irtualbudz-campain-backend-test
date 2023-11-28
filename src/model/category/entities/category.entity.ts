import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ICategory } from '../interfaces/category.interface';

@Schema({ collection: DATABASE_COLLECTION.CATEGORY, timestamps: true })
export class Category extends Model<ICategory> {
	@Prop({ required: true, trim: true })
		name: string;

	@Prop({ type: [String] })
		images: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
