# Billing API Documentation

## Base URL
```
/api/bills
```

## Endpoints

### 1. Create Bill
**POST** `/api/bills`

**Description**: Creates a new billing record for a tenant

**Request Body**:
```json
{
  "propertyId": 1,
  "propertyName": "Sunset Apartments - Unit 3B",
  "tenantName": "John Doe",
  "tenantEmail": "john@example.com",
  "currentMonth": "January 2026",
  "baseRent": 1200,
  "confirmedRent": 1200,
  "electricity": {
    "previousUnit": 1200,
    "currentUnit": 1250,
    "rate": 12
  },
  "water": {
    "previousUnit": 500,
    "currentUnit": 525,
    "rate": 5
  },
  "internet": 60,
  "otherCharges": {
    "maintenance": 50,
    "lateFee": 0
  },
  "customFields": [
    {
      "name": "Parking",
      "amount": 50
    }
  ],
  "total": 1610
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "bill": {
    "id": 1704067200000,
    "propertyId": 1,
    "propertyName": "Sunset Apartments - Unit 3B",
    "tenantName": "John Doe",
    "tenantEmail": "john@example.com",
    "currentMonth": "January 2026",
    "baseRent": 1200,
    "confirmedRent": 1200,
    "breakdown": {
      "baseRent": 1200,
      "electricity": {
        "amount": 600,
        "previousUnit": 1200,
        "currentUnit": 1250,
        "rate": 12
      },
      "water": {
        "amount": 125,
        "previousUnit": 500,
        "currentUnit": 525,
        "rate": 5
      },
      "internet": 60,
      "maintenance": 50,
      "lateFee": 0,
      "parking": 50
    },
    "customFields": [
      {
        "name": "Parking",
        "amount": 50
      }
    ],
    "total": 1610,
    "status": "pending",
    "createdAt": "2024-01-01T10:00:00Z"
  },
  "message": "Bill created successfully"
}
```

**Response (Error - 400)**:
```json
{
  "error": "Missing required fields"
}
```

**Response (Error - 500)**:
```json
{
  "error": "Failed to create bill"
}
```

**Required Fields**:
- `propertyId` (number)
- `propertyName` (string)
- `tenantName` (string)
- `baseRent` (number)
- `currentMonth` (string) - format: "Month Year"

**Optional Fields**:
- `tenantEmail` (string)
- `confirmedRent` (number) - defaults to baseRent if not provided
- `electricity` (object)
- `water` (object)
- `internet` (number)
- `otherCharges` (object)
- `customFields` (array)

---

### 2. Get Bills
**GET** `/api/bills`

**Description**: Retrieves all billing records

**Query Parameters** (Optional):
- `propertyId`: Filter by property
- `tenantId`: Filter by tenant
- `month`: Filter by billing month
- `status`: Filter by status (pending, paid, overdue)

**Response (Success - 200)**:
```json
{
  "bills": [
    {
      "id": 1704067200000,
      "propertyId": 1,
      "propertyName": "Sunset Apartments - Unit 3B",
      "tenantName": "John Doe",
      "tenantEmail": "john@example.com",
      "currentMonth": "January 2026",
      "total": 1610,
      "status": "pending",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Response (Error - 500)**:
```json
{
  "error": "Failed to fetch bills"
}
```

---

## Data Models

### Bill Object
```typescript
{
  id: number,                    // Unique identifier (timestamp)
  propertyId: number,            // Reference to property
  propertyName: string,          // Property name for display
  tenantName: string,            // Tenant name
  tenantEmail: string,           // Tenant email
  currentMonth: string,          // Billing month (e.g., "January 2026")
  baseRent: number,              // Base rent amount
  confirmedRent: number,         // Confirmed rent (may differ from base)
  breakdown: {
    baseRent: number,
    electricity: {
      amount: number,
      previousUnit: number,
      currentUnit: number,
      rate: number
    },
    water: {
      amount: number,
      previousUnit: number,
      currentUnit: number,
      rate: number
    },
    internet: number,
    [key: string]: any           // Other custom charges
  },
  customFields: Array<{
    name: string,
    amount: number
  }>,
  total: number,                 // Total amount due
  status: "pending" | "paid" | "overdue",
  paidDate?: string,             // Date when paid
  paymentMethod?: string,        // How it was paid
  proofUrl?: string,             // URL to payment proof
  createdAt: string              // ISO timestamp of creation
}
```

---

## Error Handling

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | Required fields not provided |
| 400 | Invalid input | Data format is incorrect |
| 500 | Failed to create bill | Server error |
| 500 | Failed to fetch bills | Database connection error |

---

## Implementation Notes

### Current Implementation
- Bills are stored in Next.js backend (ready for database integration)
- Data is also persisted to browser localStorage for immediate display
- localStorage key: `tenantBills`

### Future Database Integration
The API is designed to easily integrate with:
- MongoDB
- PostgreSQL
- Firebase Firestore
- Any REST-compatible database

---

## Usage Examples

### Create Bill with cURL
```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": 1,
    "propertyName": "Sunset Apartments - Unit 3B",
    "tenantName": "John Doe",
    "tenantEmail": "john@example.com",
    "currentMonth": "January 2026",
    "baseRent": 1200,
    "confirmedRent": 1200,
    "electricity": {
      "previousUnit": 1200,
      "currentUnit": 1250,
      "rate": 12
    },
    "total": 1610
  }'
```

### Create Bill with JavaScript
```javascript
const billData = {
  propertyId: 1,
  propertyName: "Sunset Apartments - Unit 3B",
  tenantName: "John Doe",
  tenantEmail: "john@example.com",
  currentMonth: "January 2026",
  baseRent: 1200,
  confirmedRent: 1200,
  electricity: {
    previousUnit: 1200,
    currentUnit: 1250,
    rate: 12
  },
  total: 1610
};

fetch('/api/bills', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(billData)
})
  .then(res => res.json())
  .then(data => console.log('Bill created:', data.bill))
  .catch(err => console.error('Error:', err));
```

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- Implement API rate limiting (e.g., 100 requests/minute per IP)
- Use authentication tokens for billing operations

---

## Authentication (Future)

Add API authentication for security:
```javascript
// Add to request headers
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_API_TOKEN'
}
```

---

## Webhook Support (Future)

Planned webhooks:
- `bill.created`: When a new bill is created
- `bill.paid`: When a bill is marked as paid
- `bill.overdue`: When a bill becomes overdue
- `bill.updated`: When a bill is modified
