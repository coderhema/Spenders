// IndexedDB utility functions

// Database configuration
const DB_NAME = "spendersDB"
const DB_VERSION = 3 // Increased version for budget goals
const EXPENSES_STORE = "expenses"
const SETTINGS_STORE = "settings"
const CATEGORIES_STORE = "categories"
const BUDGET_GOALS_STORE = "budgetGoals" // New store for budget goals

// Open the database
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // Handle database upgrade (first time or version change)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create expenses store with id as key path
      if (!db.objectStoreNames.contains(EXPENSES_STORE)) {
        const expenseStore = db.createObjectStore(EXPENSES_STORE, { keyPath: "id" })
        // Add indexes for better querying
        expenseStore.createIndex("timestamp", "timestamp", { unique: false })
        expenseStore.createIndex("category", "category", { unique: false })
      } else {
        // If store exists but we need to add indexes in a version upgrade
        const transaction = (event.target as IDBOpenDBRequest).transaction
        if (transaction) {
          const expenseStore = transaction.objectStore(EXPENSES_STORE)
          // Check if indexes exist before creating them
          if (!expenseStore.indexNames.contains("timestamp")) {
            expenseStore.createIndex("timestamp", "timestamp", { unique: false })
          }
          if (!expenseStore.indexNames.contains("category")) {
            expenseStore.createIndex("category", "category", { unique: false })
          }
        }
      }

      // Create settings store with name as key path
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "name" })
      }

      // Create categories store
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        const categoryStore = db.createObjectStore(CATEGORIES_STORE, { keyPath: "id" })
        categoryStore.createIndex("name", "name", { unique: true })
      }

      // Create budget goals store
      if (!db.objectStoreNames.contains(BUDGET_GOALS_STORE)) {
        const budgetStore = db.createObjectStore(BUDGET_GOALS_STORE, { keyPath: "id" })
        budgetStore.createIndex("category", "category", { unique: false })
        budgetStore.createIndex("period", "period", { unique: false })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error)
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// Add or update expenses
export const saveExpenses = async (expenses: any[]): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(EXPENSES_STORE, "readwrite")
    const store = transaction.objectStore(EXPENSES_STORE)

    // Clear existing expenses
    store.clear()

    // Add all expenses
    expenses.forEach((expense) => {
      store.add(expense)
    })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = (event) => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error("Error saving expenses:", error)
    throw error
  }
}

// Add a single expense
export const addExpense = async (expense: any): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(EXPENSES_STORE, "readwrite")
    const store = transaction.objectStore(EXPENSES_STORE)

    store.add(expense)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = (event) => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error("Error adding expense:", error)
    throw error
  }
}

// Get all expenses
export const getExpenses = async (): Promise<any[]> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(EXPENSES_STORE, "readonly")
    const store = transaction.objectStore(EXPENSES_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("Error getting expenses:", request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("Error retrieving expenses:", error)
    return []
  }
}

// Get expenses for a specific time period
export const getExpensesByPeriod = async (startTime: number, endTime: number): Promise<any[]> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(EXPENSES_STORE, "readonly")
    const store = transaction.objectStore(EXPENSES_STORE)
    const index = store.index("timestamp")

    // Use IDBKeyRange to get expenses within the time range
    const range = IDBKeyRange.bound(startTime, endTime)
    const request = index.getAll(range)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("Error getting expenses by period:", request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("Error retrieving expenses by period:", error)
    return []
  }
}

// Save a setting
export const saveSetting = async (name: string, value: any): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(SETTINGS_STORE, "readwrite")
    const store = transaction.objectStore(SETTINGS_STORE)

    store.put({ name, value })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error(`Error saving setting ${name}:`, error)
    throw error
  }
}

// Get a setting
export const getSetting = async (name: string, defaultValue: any = null): Promise<any> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(SETTINGS_STORE, "readonly")
    const store = transaction.objectStore(SETTINGS_STORE)
    const request = store.get(name)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result ? request.result.value : defaultValue)
      }

      request.onerror = () => {
        console.error(`Error getting setting ${name}:`, request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error(`Error retrieving setting ${name}:`, error)
    return defaultValue
  }
}

// Save a category
export const saveCategory = async (category: any): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(CATEGORIES_STORE, "readwrite")
    const store = transaction.objectStore(CATEGORIES_STORE)

    store.put(category)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error(`Error saving category:`, error)
    throw error
  }
}

// Get all categories
export const getCategories = async (): Promise<any[]> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(CATEGORIES_STORE, "readonly")
    const store = transaction.objectStore(CATEGORIES_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("Error getting categories:", request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("Error retrieving categories:", error)
    return []
  }
}

// Delete an expense by ID
export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(EXPENSES_STORE, "readwrite")
    const store = transaction.objectStore(EXPENSES_STORE)

    store.delete(id)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error(`Error deleting expense:`, error)
    throw error
  }
}

// Budget Goals Functions

// Save a budget goal
export const saveBudgetGoal = async (goal: any): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(BUDGET_GOALS_STORE, "readwrite")
    const store = transaction.objectStore(BUDGET_GOALS_STORE)

    // Add timestamps if not present
    if (!goal.createdAt) {
      goal.createdAt = Date.now()
    }
    goal.updatedAt = Date.now()

    store.put(goal)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error(`Error saving budget goal:`, error)
    throw error
  }
}

// Get all budget goals
export const getBudgetGoals = async (): Promise<any[]> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(BUDGET_GOALS_STORE, "readonly")
    const store = transaction.objectStore(BUDGET_GOALS_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("Error getting budget goals:", request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("Error retrieving budget goals:", error)
    return []
  }
}

// Get budget goals by category
export const getBudgetGoalsByCategory = async (category: string): Promise<any[]> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(BUDGET_GOALS_STORE, "readonly")
    const store = transaction.objectStore(BUDGET_GOALS_STORE)
    const index = store.index("category")
    const request = index.getAll(category)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("Error getting budget goals by category:", request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("Error retrieving budget goals by category:", error)
    return []
  }
}

// Get budget goals by period
export const getBudgetGoalsByPeriod = async (period: string): Promise<any[]> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(BUDGET_GOALS_STORE, "readonly")
    const store = transaction.objectStore(BUDGET_GOALS_STORE)
    const index = store.index("period")
    const request = index.getAll(period)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("Error getting budget goals by period:", request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("Error retrieving budget goals by period:", error)
    return []
  }
}

// Delete a budget goal by ID
export const deleteBudgetGoal = async (id: string): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(BUDGET_GOALS_STORE, "readwrite")
    const store = transaction.objectStore(BUDGET_GOALS_STORE)

    store.delete(id)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        console.error("Transaction error:", transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error(`Error deleting budget goal:`, error)
    throw error
  }
}
