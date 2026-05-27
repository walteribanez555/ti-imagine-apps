import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const MOCK_ID = '6655aabbccddeeff00112233';

const mockOrderDoc = (overrides = {}) => ({
  _id: MOCK_ID,
  customerName: 'John Doe',
  deliveryAddress: '123 Main St, CDMX',
  status: OrderStatus.PENDING,
  coordinates: { lat: 19.43, lng: -99.13 },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const buildMockModel = (doc = mockOrderDoc()) => ({
  create: jest.fn().mockResolvedValue({
    ...doc,
    toObject: () => ({ ...doc, __v: 0 }),
  }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([doc]),
      }),
    }),
  }),
  findById: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    }),
  }),
  findByIdAndUpdate: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue({ ...doc, status: OrderStatus.IN_TRANSIT }),
    }),
  }),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let mockModel: ReturnType<typeof buildMockModel>;

  beforeEach(async () => {
    mockModel = buildMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create', () => {
    it('should create an order and return an IOrder plain object', async () => {
      const dto: CreateOrderDto = {
        customerName: 'John Doe',
        deliveryAddress: '123 Main St, CDMX',
      };

      const result = await service.create(dto);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: dto.customerName,
          deliveryAddress: dto.deliveryAddress,
          coordinates: expect.objectContaining({
            lat: expect.any(Number) as unknown,
            lng: expect.any(Number) as unknown,
          }) as unknown,
        }),
      );

      expect(result).toMatchObject({
        customerName: 'John Doe',
        deliveryAddress: '123 Main St, CDMX',
        status: OrderStatus.PENDING,
      });
      expect(typeof result._id).toBe('string');
    });

    it('should use provided coordinates instead of simulating', async () => {
      const dto: CreateOrderDto = {
        customerName: 'Jane',
        deliveryAddress: 'Av. Reforma 1, CDMX',
        coordinates: { lat: 19.427, lng: -99.167 },
      };

      await service.create(dto);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ coordinates: { lat: 19.427, lng: -99.167 } }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of plain IOrder objects', async () => {
      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject({ customerName: 'John Doe' });
    });
  });

  describe('findOne', () => {
    it('should return a single IOrder when found', async () => {
      const result = await service.findOne(MOCK_ID);
      expect(result._id).toBe(MOCK_ID);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockModel.findById.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status and return the updated order', async () => {
      const dto: UpdateOrderStatusDto = { status: OrderStatus.IN_TRANSIT };
      const result = await service.updateStatus(MOCK_ID, dto);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_ID,
        { status: OrderStatus.IN_TRANSIT },
        { new: true, runValidators: true },
      );
      expect(result.status).toBe(OrderStatus.IN_TRANSIT);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) }),
      });

      const dto: UpdateOrderStatusDto = { status: OrderStatus.DELIVERED };
      await expect(service.updateStatus('bad-id', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
