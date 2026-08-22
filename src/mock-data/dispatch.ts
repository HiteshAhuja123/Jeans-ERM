import type { DispatchOrder } from "@/types";

/**
 * Seed Dispatch Orders trace back to Finished Goods: disp-101 fully dispatched prod-110's 8,000
 * pcs (now delivered) and disp-102 fully dispatched prod-111's 2,400 pcs (now in transit).
 * prod-119's 3,000 pcs on hand are deliberately left undispatched — see finished-goods.ts — so
 * there's a live "Ready for Dispatch" queue item to create a (partial) dispatch against.
 */
export const mockDispatchOrders: DispatchOrder[] = [
  {
    id: "disp-101",
    dispatchOrderNumber: "DISP-2026-00001",
    orderId: "ord-002",
    orderNumber: "ORD-2026-00453",
    customerId: "cust-003",
    customerName: "Northline Trading",
    lineItems: [
      {
        id: "disp-101-li-1",
        productionOrderId: "prod-110",
        productionOrderNumber: "PROD-2026-00110",
        styleId: "style-002",
        styleCode: "STR-118",
        styleName: "Straight 118",
        colorId: "color-004",
        colorName: "Black",
        quantity: 8000,
        unit: "pcs",
      },
    ],
    quantity: 8000,
    unit: "pcs",
    status: "delivered",
    carrier: "Maersk Line",
    trackingRef: "MAEU-9921347",
    dispatchDate: "2026-07-29",
    deliveredDate: "2026-08-12",
    recordedBy: "Ravi Chandran",
    createdDate: "2026-07-29",
  },
  {
    id: "disp-102",
    dispatchOrderNumber: "DISP-2026-00002",
    orderId: "ord-004",
    orderNumber: "ORD-2026-00455",
    customerId: "cust-004",
    customerName: "Studio Fit Co.",
    lineItems: [
      {
        id: "disp-102-li-1",
        productionOrderId: "prod-111",
        productionOrderNumber: "PROD-2026-00111",
        styleId: "style-004",
        styleCode: "SKN-440",
        styleName: "Skinny 440",
        colorId: "color-003",
        colorName: "Light Blue",
        quantity: 2400,
        unit: "pcs",
      },
    ],
    quantity: 2400,
    unit: "pcs",
    status: "in_transit",
    carrier: "DHL Freight",
    trackingRef: "DHL-4471209",
    dispatchDate: "2026-08-10",
    recordedBy: "Ravi Chandran",
    createdDate: "2026-08-10",
  },
];
