import mongoose from "mongoose";

export interface IInventoryUpdatedLog extends Document {
    // productId: mongoose.Types.ObjectId;
    sku:string,
    posProductId: string;
    newQuantity: number;
    oldQuantity: number;
    updatedAt: Date;
    productUpdatedAt: Date;
}
