export enum OrderStatus {
  PENDING    = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED  = 'delivered',
}

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface IOrder {
  _id:             string;
  customerName:    string;
  deliveryAddress: string;
  status:          OrderStatus;
  coordinates:     ICoordinates | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface CreateOrderDto {
  customerName:    string;
  deliveryAddress: string;
  coordinates?:    ICoordinates;
}
