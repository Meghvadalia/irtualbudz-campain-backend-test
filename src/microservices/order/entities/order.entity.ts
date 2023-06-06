import { ObjectType } from '@nestjs/graphql';
import { IOrder } from '../interfaces/order.interface';
import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { passwordService } from 'src/utils/password.util';

@Schema({
	collection: 'User',
	timestamps: true,
})
@ObjectType()
export class User extends Model<IOrder> {
	@Prop({ required: true, unique: true, trim: true })
	email: string;

	@Prop({ required: true })
	password: string;

	@Prop({ trim: true })
	name: string;

	@Prop({ trim: true })
	phone: string;
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
