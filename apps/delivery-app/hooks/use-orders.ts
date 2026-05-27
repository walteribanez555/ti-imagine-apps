import { useCallback, useEffect, useRef, useState } from 'react';
import { ordersApi } from '@/services/api';
import { getSocket } from '@/services/socket';
import type { IOrder, CreateOrderDto, OrderStatus } from '@/types/order';

interface UseOrdersReturn {
  orders:         IOrder[];
  loading:        boolean;
  error:          string | null;
  wsConnected:    boolean;
  incomingOrder:  IOrder | null;
  createOrder:    (dto: CreateOrderDto) => Promise<IOrder>;
  updateStatus:   (id: string, status: OrderStatus) => Promise<void>;
  refresh:        () => Promise<void>;
}

export function useOrders(): UseOrdersReturn {
  const [orders,        setOrders]        = useState<IOrder[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [wsConnected,   setWsConnected]   = useState(false);
  const [incomingOrder, setIncomingOrder] = useState<IOrder | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await ordersApi.findAll();
      setOrders(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect    = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);
    setWsConnected(socket.connected);

    const onOrderCreated = (order: IOrder) => {
      setOrders(prev => {
        if (prev.some(o => o._id === order._id)) return prev;
        return [order, ...prev];
      });

      if (toastTimer.current) clearTimeout(toastTimer.current);
      setIncomingOrder(order);
      toastTimer.current = setTimeout(() => setIncomingOrder(null), 3_000);
    };

    const onStatusUpdated = (order: IOrder) => {
      setOrders(prev =>
        prev.map(o => (o._id === order._id ? order : o)),
      );
    };

    socket.on('connect',              onConnect);
    socket.on('disconnect',           onDisconnect);
    socket.on('order:created',        onOrderCreated);
    socket.on('order:status_updated', onStatusUpdated);

    return () => {
      socket.off('connect',              onConnect);
      socket.off('disconnect',           onDisconnect);
      socket.off('order:created',        onOrderCreated);
      socket.off('order:status_updated', onStatusUpdated);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const createOrder = useCallback(async (dto: CreateOrderDto): Promise<IOrder> => {
    const order = await ordersApi.create(dto);
    setOrders(prev => [order, ...prev]);
    return order;
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: OrderStatus): Promise<void> => {
      const updated = await ordersApi.updateStatus(id, status);
      setOrders(prev => prev.map(o => (o._id === id ? updated : o)));
    },
    [],
  );

  return {
    orders,
    loading,
    error,
    wsConnected,
    incomingOrder,
    createOrder,
    updateStatus,
    refresh,
  };
}
