import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase.jsx';

// Generic Firestore operations
export const FirebaseService = {
  // Get all documents from a collection
  async getCollection(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      throw error;
    }
  },

  // Get a single document by ID
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  },

  // Add a new document
  async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  },

  // Update a document
  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  },

  // Delete a document
  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  },

  // Query documents with conditions
  async queryDocuments(collectionName, conditions = [], orderByField = null, limitCount = null) {
    try {
      let q = collection(db, collectionName);
      
      // Apply where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
      }
      
      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }
};

// Specific service functions for your CRM
export const CRMService = {
  // Orders
  async getOrders() {
    return FirebaseService.getCollection('orders');
  },

  async addOrder(orderData) {
    return FirebaseService.addDocument('orders', orderData);
  },

  async updateOrder(orderId, orderData) {
    return FirebaseService.updateDocument('orders', orderId, orderData);
  },

  async deleteOrder(orderId) {
    return FirebaseService.deleteDocument('orders', orderId);
  },

  // Services
  async getServices() {
    return FirebaseService.getCollection('services');
  },

  async addService(serviceData) {
    return FirebaseService.addDocument('services', serviceData);
  },

  async updateService(serviceId, serviceData) {
    return FirebaseService.updateDocument('services', serviceId, serviceData);
  },

  async deleteService(serviceId) {
    return FirebaseService.deleteDocument('services', serviceId);
  },

  // Spaces
  async getSpaces() {
    return FirebaseService.getCollection('spaces');
  },

  async addSpace(spaceData) {
    return FirebaseService.addDocument('spaces', spaceData);
  },

  async updateSpace(spaceId, spaceData) {
    return FirebaseService.updateDocument('spaces', spaceId, spaceData);
  },

  async deleteSpace(spaceId) {
    return FirebaseService.deleteDocument('spaces', spaceId);
  },

  // Cities
  async getCities() {
    return FirebaseService.getCollection('cities');
  },

  async addCity(cityData) {
    return FirebaseService.addDocument('cities', cityData);
  },

  async updateCity(cityId, cityData) {
    return FirebaseService.updateDocument('cities', cityId, cityData);
  },

  async deleteCity(cityId) {
    return FirebaseService.deleteDocument('cities', cityId);
  }
}; 