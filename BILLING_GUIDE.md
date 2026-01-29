# Billing System - User Guide

## Getting Started

### 1. Add a Tenant to a Property

**Navigate to**: Properties → [Select Property] → Billing Profile Tab

**Steps**:
1. Click the "Add User" button
2. Choose one of two options:
   - **Share QR Code**: Copy the property ID and share via QR
   - **Add Manually**: 
     - Enter tenant name, email, and phone
     - Set date joined and lease end date
     - Click "Save Tenant"

**Result**: Tenant card displays all tenant information with Edit and Remove options

---

### 2. Create a Bill

**Navigate to**: Rent & Transactions → Click "Create Bill" button (top right)

#### Step 1: Select Property
- Choose a property that has a tenant assigned
- Review the pre-filled tenant information
- Click "Continue"

#### Step 2: Fill Bill Details

**Basic Information**:
- **Billing Month**: Select the month for this bill
- **Confirmed Rent**: Auto-filled from property, edit if different

**Electricity Charges**:
- Previous meter reading (unit)
- Current meter reading (unit)
- Rate per unit (defaults to 12)
- Amount auto-calculates: (Current - Previous) × Rate

**Water Charges**:
- Previous meter reading (unit)
- Current meter reading (unit)
- Rate per unit (defaults to 5)
- Amount auto-calculates: (Current - Previous) × Rate

**Internet Bill**:
- Enter monthly internet charge

**Custom Charges** (Optional):
- Click "Add Field" to add additional charges
- Enter field name and amount
- Add multiple fields as needed
- Delete fields individually if needed

**Total**: Shows real-time total of all charges

**Create Bill**: Click button to save and create bill

---

### 3. View Created Bills

**Navigate to**: Rent & Transactions → Receipts Tab

**Tenant Payment Receipts Section**:
- Shows all created bills
- Displays:
  - Tenant name
  - Billing month
  - Status (pending, paid, overdue)
  - Property name
  - Breakdown summary (rent, utilities, internet)
  - Total amount

**View Details**:
- Click a bill card to view complete breakdown
- See all charges and meter readings
- View payment status

---

## Bill Details Breakdown

When you create a bill, it includes:

| Field | Auto-filled? | Editable? |
|-------|-------------|-----------|
| Property Name | Yes | No |
| Tenant Name | Yes | No |
| Tenant Email | Yes | No |
| Billing Month | No | Yes |
| Base Rent | Yes (from property) | Yes |
| Electricity | No | Yes (meter readings) |
| Water | No | Yes (meter readings) |
| Internet | No | Yes |
| Custom Fields | No | Yes (unlimited) |

---

## Calculation Examples

### Electricity Example
- Previous Reading: 1200 units
- Current Reading: 1250 units
- Rate: 12 per unit
- Calculation: (1250 - 1200) × 12 = 50 × 12 = **$600**

### Complete Bill Example
| Item | Amount |
|------|--------|
| Base Rent | $1,500 |
| Electricity | $600 |
| Water | $150 |
| Internet | $80 |
| Maintenance Charge | $50 |
| **Total** | **$2,380** |

---

## Managing Bills

### View Bill
- Click on bill card in Receipts section
- Opens detailed breakdown view
- Shows all charges and calculations

### Mark as Paid
- Use "Mark as Paid" button on top menu
- Record payment method and date
- Upload payment proof (if needed)

### Delete Bill
- Edit capability available through API
- Currently bills are created with pending status

---

## Tips & Best Practices

1. **Meter Readings**: Record both previous and current readings accurately for accurate utility calculations

2. **Rate Configuration**: Set rates based on your utility provider agreements
   - Default electricity rate: 12 per unit
   - Default water rate: 5 per unit
   - Modify as needed per bill

3. **Custom Charges**: Use for:
   - Maintenance charges
   - Late fees
   - Parking charges
   - Pet fees
   - Any other property-specific charges

4. **Billing Cycle**: Create bills on a monthly basis to maintain clear records

5. **Tenant Communication**: Share bill details with tenants after creation

---

## Data Storage

All bills are automatically saved to:
- **Local Storage**: `tenantBills` key
- **API**: POST to `/api/bills` endpoint

Data persists across browser sessions in local storage.

---

## Future Features (Planned)

- Automated monthly bill generation
- Email notifications to tenants
- Payment reminders
- Late fee calculation
- Receipt PDF export
- Payment gateway integration
- Multiple tenant management per property
- Recurring custom charges

---

## Support

For technical issues or feature requests, contact development team.
