import {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '../features/cart/cartApi';
import { useAppDispatch } from '../app/store';
import { addToast } from '../features/ui/uiSlice';

export const useCart = () => {
  const dispatch               = useAppDispatch();
  const { data, isLoading }    = useGetCartQuery();
  const [addItem]              = useAddToCartMutation();
  const [updateItem]           = useUpdateCartItemMutation();
  const [removeItem]           = useRemoveCartItemMutation();
  const [clearCartMutation]    = useClearCartMutation();

  const cart = data?.data?.cart;

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      await addItem({ productId, quantity }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Added to cart!' }));
    } catch (err: any) {
      dispatch(addToast({
        type:    'error',
        message: err.data?.message ?? 'Failed to add item',
      }));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      await updateItem({ productId, quantity }).unwrap();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.data?.message ?? 'Update failed' }));
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await removeItem(productId).unwrap();
      dispatch(addToast({ type: 'info', message: 'Item removed' }));
    } catch {}
  };

  const clearCart = async () => {
    try { await clearCartMutation().unwrap(); } catch {}
  };

  return {
    cart,
    isLoading,
    itemCount:  cart?.itemCount  ?? 0,
    totalItems: cart?.totalItems ?? 0,
    total:      cart?.total      ?? 0,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};
