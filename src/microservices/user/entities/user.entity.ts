import { ObjectType } from '@nestjs/graphql';
import { IUser } from '../interfaces/user.interface';
import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USER_TYPE } from '../constants/user.constant';
import { passwordService } from 'src/utils/password.util';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({
	collection: DATABASE_COLLECTION.USER,
	timestamps: true,
})
@ObjectType()
export class User extends Model<IUser> {
	@Prop({ required: true, unique: true, trim: true })
		email: string;

	@Prop({ required: true })
		password: string;

	@Prop({ trim: true })
		name: string;

	@Prop({ trim: true })
		phone: string;

	@Prop({ required: true })
		type: USER_TYPE;

	@Prop({
		trim: true,
		default: '',
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.COMPANIES,
	})
		companyId: string;

	@Prop({
		trim: true,
		default: '',
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.STORES,
	})
		storeId: string;

	@Prop({ default: true, type: Boolean })
		isActive: boolean;

	@Prop({ default: false, type: Boolean })
		isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
	const user = this;
	if (!user.isModified('password')) {
		return next();
	}
	try {
		user.password = await passwordService.hashPassword(user.password);
		next();
	} catch (error) {
		return next(error);
	}
});

UserSchema.methods.toJSON = function () {
	const { password, type, __v, createdAt, updatedAt, ...userObject } = this.toObject();
	return userObject;
};
