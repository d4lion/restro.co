"use server";

import { orderRepository } from "@/lib/repositories/order.repository";
import type { CreateOrderDto } from "@/lib/types";

export type OrderActionResult = {
  success: boolean;
  message: string;
  orderId?: string;
};

export async function createPublicOrderAction(
  data: CreateOrderDto
): Promise<OrderActionResult> {
  try {
    if (!data.tenantId || !data.items || data.items.length === 0) {
      return { success: false, message: "Datos de orden inválidos" };
    }

    const order = await orderRepository.create(data);
    
    // In the future, we can revalidate paths or push websocket notifications
    // revalidatePath("/orders");

    return { 
      success: true, 
      message: "Orden enviada a cocina",
      orderId: order.id
    };
  } catch (error) {
    console.error("Error creating public order:", error);
    return { success: false, message: "Hubo un error procesando la orden" };
  }
}
