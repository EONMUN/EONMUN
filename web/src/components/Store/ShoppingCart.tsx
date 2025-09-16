"use client"

import React from 'react';
import CustomImage from '@/components/Image';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { FrostedGlass } from '../ui/FrostedGlass';
import { LinkComponent } from '../LinkComponent';

export function ShoppingCart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            <span className="text-sm text-gray-500">({cart.length} items)</span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                Your cart is empty
              </p>
              <LinkComponent
                href="/store"
                onClick={() => setIsCartOpen(false)}
                className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue Shopping
              </LinkComponent>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <FrostedGlass key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <CustomImage
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      <p className="text-lg font-semibold mb-2">
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </FrostedGlass>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold">${getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-600 dark:text-gray-400">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span>${getTotalPrice().toLocaleString()}</span>
              </div>
            </div>
            <button className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity font-semibold mb-2">
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}