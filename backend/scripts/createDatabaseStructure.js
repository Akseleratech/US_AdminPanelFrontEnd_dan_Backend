const { db, admin } = require('../config/firebase');

class DatabaseStructureCreator {
  constructor() {
    this.structures = {
      orders: {
        schema: {
          id: 'string',
          customer: 'string',
          customerEmail: 'string',
          service: 'string',
          serviceId: 'string',
          space: 'string',
          spaceId: 'string',
          location: 'string',
          cityId: 'string',
          status: 'enum:pending,confirmed,completed,cancelled',
          amount: 'number',
          currency: 'string',
          date: 'date',
          startDate: 'date',
          endDate: 'date',
          duration: 'number', // in hours
          notes: 'string',
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
          createdBy: 'string' // user ID
        },
        sampleData: {
          customer: 'John Doe',
          customerEmail: 'john@example.com',
          service: 'Private Office',
          serviceId: 'service_001',
          space: 'Office Suite A1',
          spaceId: 'space_001',
          location: 'Jakarta Selatan',
          cityId: 'JKT001',
          status: 'confirmed',
          amount: 2500000,
          currency: 'IDR',
          date: '2024-06-15',
          startDate: '2024-06-15T09:00:00Z',
          endDate: '2024-06-15T17:00:00Z',
          duration: 8,
          notes: 'Corporate meeting space'
        }
      },

      spaces: {
        schema: {
          id: 'string',
          name: 'string',
          slug: 'string',
          type: 'enum:private_office,meeting_room,event_space,coworking_space,virtual_office',
          description: 'string',
          location: 'object',
          cityId: 'string',
          capacity: 'number',
          amenities: 'array',
          pricing: 'object',
          availability: 'object',
          images: 'array',
          status: 'enum:available,occupied,maintenance,inactive',
          features: 'object',
          bookingRules: 'object',
          rating: 'number',
          reviewCount: 'number',
          createdAt: 'timestamp',
          updatedAt: 'timestamp'
        },
        sampleData: {
          name: 'Premium Office Suite A1',
          slug: 'premium-office-suite-a1',
          type: 'private_office',
          description: 'Modern private office with city view and premium amenities',
          location: {
            address: 'Jl. Sudirman No. 123',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            country: 'Indonesia',
            postalCode: '12190',
            coordinates: {
              latitude: -6.2088,
              longitude: 106.8456
            }
          },
          cityId: 'JKT001',
          capacity: 4,
          amenities: ['High-speed WiFi', 'Air Conditioning', 'Projector', 'Whiteboard', 'Coffee/Tea'],
          pricing: {
            hourly: 250000,
            daily: 1500000,
            weekly: 8000000,
            monthly: 25000000,
            currency: 'IDR'
          },
          availability: {
            schedule: {
              monday: { open: '08:00', close: '22:00', available: true },
              tuesday: { open: '08:00', close: '22:00', available: true },
              wednesday: { open: '08:00', close: '22:00', available: true },
              thursday: { open: '08:00', close: '22:00', available: true },
              friday: { open: '08:00', close: '22:00', available: true },
              saturday: { open: '09:00', close: '18:00', available: true },
              sunday: { open: '09:00', close: '18:00', available: false }
            },
            minimumBookingHours: 2,
            maximumBookingDays: 30
          },
          images: [
            'https://storage.googleapis.com/bucket/space1-main.jpg',
            'https://storage.googleapis.com/bucket/space1-interior.jpg'
          ],
          status: 'available',
          features: {
            parking: true,
            reception: true,
            kitchen: true,
            printer: true,
            scanner: true,
            meetingRoomAccess: true
          },
          bookingRules: {
            advanceBookingDays: 30,
            cancellationPolicy: '24_hours',
            requiresApproval: false,
            instantBooking: true
          },
          rating: 4.8,
          reviewCount: 127
        }
      },

      cities: {
        schema: {
          id: 'string',
          name: 'string',
          slug: 'string',
          country: 'object',
          location: 'object',
          timezone: 'string',
          currency: 'string',
          statistics: 'object',
          businessInfo: 'object',
          display: 'object',
          search: 'object',
          isActive: 'boolean',
          isPopular: 'boolean',
          hasAirport: 'boolean',
          hasPublicTransport: 'boolean',
          createdAt: 'timestamp',
          updatedAt: 'timestamp'
        },
        sampleData: {
          name: 'Jakarta',
          slug: 'jakarta',
          country: {
            id: 'ID',
            name: 'Indonesia',
            code: 'IDN',
            phoneCode: '+62'
          },
          location: {
            coordinates: {
              latitude: -6.2088,
              longitude: 106.8456
            },
            boundingBox: {
              northeast: { lat: -6.0744, lng: 106.9758 },
              southwest: { lat: -6.3676, lng: 106.6924 }
            },
            area: 664.01,
            elevation: 8
          },
          timezone: 'Asia/Jakarta',
          currency: 'IDR',
          statistics: {
            totalSpaces: 45,
            activeSpaces: 42,
            totalBookings: 1250,
            avgRating: 4.7
          },
          businessInfo: {
            isServiceAvailable: true,
            launchDate: '2024-01-15',
            supportedBrands: ['NextSpace', 'UnionSpace'],
            taxRate: 0.11
          },
          display: {
            featured: true,
            order: 1,
            heroImage: 'https://storage.googleapis.com/bucket/jakarta-hero.jpg',
            thumbnailImage: 'https://storage.googleapis.com/bucket/jakarta-thumb.jpg',
            description: "Indonesia's bustling capital city with modern co-working spaces",
            tags: ['metropolitan', 'business-hub', 'technology']
          },
          search: {
            keywords: ['jakarta', 'dki', 'capital', 'indonesia'],
            aliases: ['JKT', 'Djakarta', 'Batavia'],
            metaTitle: 'Co-working Spaces in Jakarta - NextSpace & UnionSpace',
            metaDescription: 'Find and book the best co-working spaces in Jakarta'
          },
          isActive: true,
          isPopular: true,
          hasAirport: true,
          hasPublicTransport: true
        }
      },

      services: {
        schema: {
          id: 'string',
          name: 'string',
          slug: 'string',
          category: 'enum:workspace,meeting,event,virtual,support',
          description: 'string',
          shortDescription: 'string',
          pricing: 'object',
          features: 'array',
          inclusions: 'array',
          exclusions: 'array',
          requirements: 'array',
          availability: 'object',
          images: 'array',
          status: 'enum:active,inactive,coming_soon',
          display: 'object',
          seo: 'object',
          createdAt: 'timestamp',
          updatedAt: 'timestamp'
        },
        sampleData: {
          name: 'Private Office',
          slug: 'private-office',
          category: 'workspace',
          description: 'Dedicated private office space with premium amenities and 24/7 access',
          shortDescription: 'Exclusive private workspace for teams and businesses',
          pricing: {
            basePrice: 2500000,
            currency: 'IDR',
            billingType: 'monthly',
            priceRange: {
              min: 1500000,
              max: 5000000
            },
            discounts: {
              quarterly: 0.1,
              yearly: 0.2
            }
          },
          features: [
            'Dedicated workspace',
            '24/7 access',
            'Meeting room credits',
            'Business address',
            'Mail handling',
            'Reception services'
          ],
          inclusions: [
            'High-speed internet',
            'Utilities',
            'Cleaning service',
            'Security',
            'Parking space'
          ],
          exclusions: [
            'Furniture (optional)',
            'Phone line setup',
            'Additional storage'
          ],
          requirements: [
            'Valid business registration',
            'Security deposit',
            'Minimum 3-month contract'
          ],
          availability: {
            instantBooking: false,
            requiresApproval: true,
            advanceBookingDays: 7,
            minimumContractMonths: 3
          },
          images: [
            'https://storage.googleapis.com/bucket/service-private-office.jpg'
          ],
          status: 'active',
          display: {
            featured: true,
            order: 1,
            badge: 'Most Popular',
            color: '#2563eb'
          },
          seo: {
            metaTitle: 'Private Office Rental - Premium Workspace Solutions',
            metaDescription: 'Rent a private office with premium amenities and flexible terms',
            keywords: ['private office', 'office rental', 'workspace', 'business']
          }
        }
      },

      users: {
        schema: {
          uid: 'string',
          email: 'string',
          displayName: 'string',
          photoURL: 'string',
          role: 'enum:admin,manager,staff,customer',
          profile: 'object',
          preferences: 'object',
          permissions: 'array',
          status: 'enum:active,inactive,suspended',
          lastLoginAt: 'timestamp',
          createdAt: 'timestamp',
          updatedAt: 'timestamp'
        },
        sampleData: {
          email: 'admin@unionspace.com',
          displayName: 'Admin User',
          photoURL: null,
          role: 'admin',
          profile: {
            firstName: 'Admin',
            lastName: 'User',
            phone: '+62812345678',
            company: 'UnionSpace',
            position: 'System Administrator'
          },
          preferences: {
            language: 'id',
            timezone: 'Asia/Jakarta',
            currency: 'IDR',
            notifications: {
              email: true,
              push: true,
              sms: false
            }
          },
          permissions: ['read:all', 'write:all', 'delete:all', 'admin:all'],
          status: 'active',
          lastLoginAt: new Date()
        }
      }
    };
  }

  async createCollection(collectionName, structure) {
    try {
      console.log(`\n🏗️  Creating collection: ${collectionName}`);
      
      // Create sample document to establish collection
      const sampleDoc = {
        ...structure.sampleData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        _schema: structure.schema // Store schema for reference
      };

      const docRef = await db.collection(collectionName).add(sampleDoc);
      console.log(`✅ Created ${collectionName} with sample document: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error creating ${collectionName}:`, error);
      throw error;
    }
  }

  async createSecurityRules() {
    console.log('\n🔐 Security Rules Template Created');
    console.log('=====================================');
    
    const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        request.auth.token.role in ['admin', 'manager'];
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role in ['admin', 'manager', 'staff'];
    }
    
    // Spaces collection
    match /spaces/{spaceId} {
      allow read: if true; // Public read for browsing
      allow write: if request.auth != null && 
        request.auth.token.role in ['admin', 'manager'];
    }
    
    // Cities collection
    match /cities/{cityId} {
      allow read: if true; // Public read
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
    
    // Services collection
    match /services/{serviceId} {
      allow read: if true; // Public read
      allow write: if request.auth != null && 
        request.auth.token.role in ['admin', 'manager'];
    }
  }
}`;

    console.log(securityRules);
    console.log('\n📝 Copy the above rules to Firebase Console → Firestore → Rules');
    return securityRules;
  }

  async createAllStructures() {
    try {
      console.log('\n🏗️  Creating Database Structures...');
      console.log('=====================================');
      
      const results = {};
      
      for (const [collectionName, structure] of Object.entries(this.structures)) {
        const docId = await this.createCollection(collectionName, structure);
        results[collectionName] = docId;
      }

      await this.createSecurityRules();
      
      console.log('\n🎉 Database structure creation completed!');
      console.log('=====================================');
      console.log('\n📊 Created Collections:');
      Object.entries(results).forEach(([collection, docId]) => {
        console.log(`• ${collection}: ${docId}`);
      });
      
      return results;
    } catch (error) {
      console.error('\n💥 Database structure creation failed:', error);
      throw error;
    }
  }

  async validateStructure() {
    try {
      console.log('\n🔍 Validating database structure...');
      
      for (const collectionName of Object.keys(this.structures)) {
        const snapshot = await db.collection(collectionName).limit(1).get();
        if (snapshot.empty) {
          console.log(`⚠️  Collection ${collectionName} is empty`);
        } else {
          console.log(`✅ Collection ${collectionName} exists with data`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Structure validation failed:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  try {
    const creator = new DatabaseStructureCreator();
    
    const args = process.argv.slice(2);
    const validateOnly = args.includes('--validate') || args.includes('-v');
    
    if (validateOnly) {
      await creator.validateStructure();
    } else {
      await creator.createAllStructures();
      await creator.validateStructure();
    }
    
    console.log('\n✨ Database structure is ready!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Failed:', error);
    process.exit(1);
  }
}

module.exports = DatabaseStructureCreator;

if (require.main === module) {
  main();
} 