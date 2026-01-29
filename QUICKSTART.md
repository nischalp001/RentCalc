# Quick Start Guide - Billing System

## 5-Minute Setup

### Step 1: View a Property
1. Go to **Properties** page
2. Click on any property (or add one first)
3. You'll see the property details page

### Step 2: Add a Tenant
1. On the property details page, look at the right sidebar
2. Click **"Add User"** button
3. Option A - Share QR: Copy the ID to share
4. Option B - Manual: Click "Add Manually"
   - Fill in: Name, Email, Phone
   - Set: Date Joined and Lease End dates
   - Click **"Save Tenant"**

### Step 3: Create Your First Bill
1. Go to **Rent & Transactions** page
2. Click **"Create Bill"** button (top right)
3. **Select Property**: Choose the property you just added
4. Click **"Continue"**
5. **Fill Bill Details**:
   - Billing Month: Select a month
   - Confirmed Rent: Check/edit the amount
   - Electricity: Enter meter readings (or skip)
   - Water: Enter meter readings (or skip)
   - Internet: Enter amount (or skip)
6. Click **"Add Field"** if you need to add extra charges
7. Check the total amount
8. Click **"Create Bill"**

### Step 4: View Your Bill
1. Still on **Rent & Transactions** page
2. Scroll to **"Tenant Payment Receipts"** section
3. Your new bill should appear as a card
4. Click the bill to see full details

---

## Common Tasks

### Add Multiple Charges to a Bill

**During Bill Creation**:
1. Scroll to "Additional Charges" section
2. Click **"+ Add Field"**
3. Enter field name (e.g., "Maintenance")
4. Enter amount
5. Add more fields by clicking again
6. Total updates automatically

### Edit/Remove Tenant

**On Property Page**:
1. Look at right sidebar - you'll see tenant card
2. Click **"Edit"** to modify tenant details
3. Click **"Remove"** to delete tenant

### Check Bill Total Before Creating

**During Bill Creation - Step 2**:
- Look at bottom of form
- Blue "Total Bill Amount" box shows real-time total
- Includes all charges (rent + utilities + custom)

### Mark Bill as Paid

**On Transactions Page**:
1. Click "Mark as Paid" button (top right)
2. Select bill
3. Choose payment method
4. Enter payment date
5. Submit

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create Bill | Alt + B |
| Add Tenant | Alt + T |
| Copy Property ID | Click copy button in dialog |

---

## Common Scenarios

### Scenario 1: Monthly Rent Only
1. Create bill
2. Skip all utilities
3. Enter rent amount
4. Create bill

### Scenario 2: Rent + Utilities
1. Create bill
2. Enter meter readings for electricity
3. Enter meter readings for water
4. Enter internet bill
5. Create bill

### Scenario 3: Rent + Utilities + Maintenance
1. Create bill
2. Add utilities as above
3. Scroll to "Additional Charges"
4. Add field: "Maintenance" = $100
5. Create bill

### Scenario 4: Late Fee
1. Create bill
2. Add utilities
3. Add "Late Fee" field
4. Enter late fee amount
5. Create bill

---

## Troubleshooting

### Bill Not Creating?
- ✓ Check you selected a property with a tenant
- ✓ Check you entered billing month
- ✓ Check you entered a confirmed rent amount

### Tenant Not Appearing?
- ✓ Click "Add User" button and save tenant first
- ✓ Refresh page if still not showing

### Meter Readings Not Calculating?
- ✓ Enter BOTH previous AND current readings
- ✓ Make sure current is higher than previous
- ✓ Check rate is filled in

### Data Lost After Refresh?
- Don't worry - it's saved in browser storage
- All bills and properties persist

---

## Tips & Tricks

### ⚡ Quick Bill Creation
- Rent usually matches property rent
- Electricity rate is typically 12/unit
- Water rate is typically 5/unit
- Custom fields can be any charge type

### 📊 Viewing Bills
- Bills show as cards in chronological order
- Color badge shows status (green=pending, blue=paid)
- Click any bill to see complete breakdown

### 📝 Utility Charges
- Always enter meter readings
- System automatically calculates cost
- Example: (1250-1200) × 12 = $600

### 💰 Total Calculation
- See total update in real-time
- Bottom of form shows "Total Bill Amount"
- Includes all charges

---

## Data Locations

**Where Bill Data Is Stored**:
- Browser localStorage (automatic)
- Can also be sent to API at `/api/bills`

**Where Tenant Data Is Stored**:
- In the property record
- localStorage key: `properties`

**What Happens on Browser Refresh**:
- ✅ Bills persist
- ✅ Tenants persist
- ✅ Properties persist
- ✓ No data loss

---

## Getting Help

### Check These Files for More Info
1. **BILLING_GUIDE.md** - Detailed user guide
2. **IMPLEMENTATION_OVERVIEW.md** - Technical details
3. **API_DOCUMENTATION.md** - API reference

### What to Check First
1. Is tenant added to property? ✓
2. Is rent amount entered? ✓
3. Are meter readings valid (current > previous)? ✓
4. Is month selected? ✓

---

## Next Steps

After creating your first bill:

1. **Create More Bills**: For other properties/months
2. **View Analytics**: See billing patterns (future feature)
3. **Email Tenants**: Share bill details (future feature)
4. **Mark as Paid**: Record payment (available now)
5. **View Reports**: Analyze rent collection (future feature)

---

## Feature Availability

### Available Now ✅
- Add/Edit/Remove tenants
- Create detailed bills
- Add multiple charges
- View bills and details
- Calculate utilities automatically
- Save to localStorage
- API endpoint ready

### Coming Soon 🔜
- Email bill to tenant
- Mark bills as paid
- Payment reminders
- PDF receipts
- Monthly automation
- Analytics dashboard

---

## Contact & Support

For issues or questions, refer to:
- Main documentation files in project root
- Code comments in source files
- API documentation in `/app/api`

---

**Happy Billing! 🎉**

Start with the 5-Minute Setup above and you'll be creating bills in minutes!
