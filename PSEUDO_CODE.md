# Splitsmart Application Pseudo Code

## 1. Bill Splitting Logic

This module handles the distribution of expenses among group members based on the selected mode (Equal, Percentage, or Itemized).

```pseudo
FUNCTION SplitBill(amount, payer, members, mode, splitDetails):
    Initialize balances map
    
    // Credit the payer
    balances[payer] = amount
    
    IF mode IS "EQUAL":
        share = amount / count(members)
        FOR EACH member IN members:
            balances[member] = balances[member] - share
            
    ELSE IF mode IS "PERCENTAGE":
        FOR EACH member IN members:
            percentage = getPercentage(member, splitDetails)
            share = (percentage / 100) * amount
            balances[member] = balances[member] - share
            
    ELSE IF mode IS "ITEMS":
        // Distribute item costs
        FOR EACH item IN splitDetails.items:
            itemCost = item.price
            assignedUsers = item.assignedTo
            costPerUser = itemCost / count(assignedUsers)
            
            FOR EACH user IN assignedUsers:
                balances[user] = balances[user] - costPerUser
        
        // Distribute Tax and Tip proportionally
        totalBaseCost = sum(splitDetails.items.price)
        taxAndTip = amount - totalBaseCost
        
        FOR EACH member IN members:
            memberBaseCost = CalculateBaseCost(member, splitDetails.items)
            proportion = memberBaseCost / totalBaseCost
            extraShare = taxAndTip * proportion
            balances[member] = balances[member] - extraShare
            
    RETURN balances
END FUNCTION
```

## 2. Debt Settlement Algorithm (Greedy Approach)

This algorithm calculates the minimum number of transactions required to settle debts within a group.

```pseudo
FUNCTION CalculateSettlements(expenses, groupMembers):
    Initialize netBalances map for each member to 0
    
    // Step 1: Calculate Net Balances
    FOR EACH expense IN expenses:
        payer = expense.paidBy
        amount = expense.amount
        
        // Add to payer's credit
        netBalances[payer] += amount
        
        // Subtract from split members
        splitMembers = expense.splitBetween
        share = amount / count(splitMembers) // Assuming equal split for simplicity in this step
        FOR EACH member IN splitMembers:
            netBalances[member] -= share
            
    // Step 2: Separate Debtors and Creditors
    Initialize debtors list
    Initialize creditors list
    
    FOR EACH member, balance IN netBalances:
        IF balance < 0:
            ADD {member, abs(balance)} TO debtors
        ELSE IF balance > 0:
            ADD {member, balance} TO creditors
            
    // Sort both lists by amount (Optional optimization for greedy)
    SORT debtors BY amount ASC
    SORT creditors BY amount DESC
    
    // Step 3: Match Debts
    Initialize transactions list
    i = 0 // debtor index
    j = 0 // creditor index
    
    WHILE i < length(debtors) AND j < length(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        
        // Calculate settlement amount (min of what debtor owes and creditor is owed)
        amountToSettle = MIN(debtor.amount, creditor.amount)
        
        ADD {from: debtor.id, to: creditor.id, amount: amountToSettle} TO transactions
        
        // Update remaining amounts
        debtor.amount -= amountToSettle
        creditor.amount -= amountToSettle
        
        // Move to next provided if settled
        IF debtor.amount roughly EQUALS 0:
            i = i + 1
        IF creditor.amount roughly EQUALS 0:
            j = j + 1
            
    RETURN transactions
END FUNCTION
```

## 3. OCR Receipt Scanning Flow

This process describes the flow from capturing an image to extracting structured data.

```pseudo
FUNCTION ProcessReceipt(imageURI):
    // Step 1: Pre-process Image
    image = LoadImage(imageURI)
    compressedImage = Compress(image, quality=0.8)
    base64Image = ConvertToBase64(compressedImage)
    
    // Step 2: Call AI/OCR Service
    Request payload = {
        image: base64Image,
        prompt: "Extract merchant, date, total, tax, and line items (desc, qty, price)"
    }
    
    response = CallGeminiAPI(payload) // or other OCR provider
    
    // Step 3: Parse and Validate
    IF response.isError:
        RETURN Error("Extraction Failed")
        
    rawData = ParseJSON(response.text)
    
    structuredReceipt = {
        merchant: rawData.merchant OR "Unknown",
        date: ParseDate(rawData.date) OR Today,
        total: ParseFloat(rawData.total),
        items: []
    }
    
    FOR EACH item IN rawData.items:
        cleanItem = {
            description: item.description,
            amount: ParseFloat(item.amount)
        }
        ADD cleanItem TO structuredReceipt.items
        
    RETURN structuredReceipt
END FUNCTION
```

## 4. Group Creation and Member Management

```pseudo
FUNCTION CreateGroup(groupName, creatorUser):
    groupId = GenerateUniqueId()
    
    groupData = {
        id: groupId,
        name: groupName,
        members: [creatorUser],
        createdAt: CurrentTimestamp(),
        createdBy: creatorUser.id
    }
    
    SaveToDatabase("groups", groupId, groupData)
    RETURN groupId
END FUNCTION

FUNCTION AddMember(groupId, newMemberName):
    group = FetchFromDatabase("groups", groupId)
    
    newMember = {
        id: GenerateUniqueId(),
        name: newMemberName,
        joinedAt: CurrentTimestamp()
    }
    
    APPEND newMember TO group.members
    UpdateDatabase("groups", groupId, group)
    
    RETURN newMember
END FUNCTION

## 5. Recurring Expense Processing

Logic to handle expenses that repeat periodically (e.g., Rent, Netflix).

```pseudo
FUNCTION CheckAndCreateRecurringExpenses():
    today = CurrentDate()
    recurringRules = FetchFromDatabase("recurring_expenses", { active: true })
    
    FOR EACH rule IN recurringRules:
        IF IsDueToday(rule.nextDueDate, today):
            // Create the actual expense entry
            newExpense = {
                groupId: rule.groupId,
                description: rule.description,
                amount: rule.amount,
                paidBy: rule.paidBy,
                splitBetween: rule.splitDetails,
                date: today,
                isRecurringInstance: true
            }
            
            SaveToDatabase("expenses", GenerateId(), newExpense)
            
            // Update next due date
            rule.lastProcessed = today
            rule.nextDueDate = CalculateNextDate(today, rule.frequency) // e.g. +1 Month
            
            UpdateDatabase("recurring_expenses", rule.id, rule)
            
            NotifyUsers(rule.groupId, "Recurring expense " + rule.description + " added.")
END FUNCTION
```
```
