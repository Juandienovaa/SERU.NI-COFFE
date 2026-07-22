import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseRealtimeOrdersProps {
  filter?: string; // e.g. "id=eq.123"
  limit?: number;
  orderBy?: { column: string; ascending: boolean };
}

const DEFAULT_ORDER_BY = { column: 'created_at', ascending: false };

export function useRealtimeOrders({ filter, limit = 50, orderBy = DEFAULT_ORDER_BY }: UseRealtimeOrdersProps = {}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'>('CONNECTING');
  const ordersRef = useRef<any[]>([]);
  
  // Stabilize dependencies to avoid infinite loops from inline object references
  const filterDep = filter;
  const limitDep = limit;
  const orderByDep = JSON.stringify(orderBy);

  // Update ref synchronously so realtime handlers always have latest state without closure stale issues
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const fetchSingleOrder = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('online_orders')
      .select('*, online_order_items(*)')
      .eq('id', id)
      .single();
    if (!error && data) {
      return data;
    }
    return null;
  }, []);

  const fetchInitialOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('online_orders').select('*, online_order_items(*)');
    
    if (filter) {
      // Basic parsing of filter if it's "id=eq.123" to apply to initial fetch
      const [col, opAndVal] = filter.split('=');
      const [op, val] = opAndVal.split('.');
      if (op === 'eq') {
        query = query.eq(col, val);
      }
    }
    
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, [filterDep, limitDep, orderByDep]);

  useEffect(() => {
    fetchInitialOrders();

    const channelName = `online_orders_sync_${filter || 'all'}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'online_orders',
          filter: filter,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const fullOrder = await fetchSingleOrder(payload.new.id);
            if (fullOrder) {
              setOrders((prev) => {
                const exists = prev.find(o => o.id === fullOrder.id);
                if (exists) return prev;
                const newOrders = [fullOrder, ...prev];
                // basic sorting manually
                return orderBy.ascending 
                  ? newOrders.sort((a, b) => new Date(a[orderBy.column]).getTime() - new Date(b[orderBy.column]).getTime())
                  : newOrders.sort((a, b) => new Date(b[orderBy.column]).getTime() - new Date(a[orderBy.column]).getTime());
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Because online_order_items might not change on simple status update, we can merge or refetch. 
            // The prompt says: "When row changes immediately refetch ONLY that order."
            const fullOrder = await fetchSingleOrder(payload.new.id);
            if (fullOrder) {
              setOrders((prev) => prev.map((o) => (o.id === fullOrder.id ? fullOrder : o)));
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('ERROR');
        } else if (status === 'CLOSED') {
          setConnectionStatus('CONNECTING'); // Trying to reconnect implies closed but supabase auto reconnects? 
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterDep, fetchInitialOrders, fetchSingleOrder]);

  return { orders, setOrders, loading, connectionStatus };
}
