// Load environment variables
require('dotenv').config();

const { db, admin } = require('../config/firebase');

class RefBasedDatabaseSeeder {
  constructor() {
    this.sampleData = {
      cities: [
        {
          cityId: "JKT001",
          name: "Jakarta",
          country: {
            id: "ID",
            name: "Indonesia",
            code: "IDN",
            phoneCode: "+62"
          },
          location: {
            coordinates: new admin.firestore.GeoPoint(-6.2088, 106.8456),
            latitude: -6.2088,
            longitude: 106.8456,
            boundingBox: {
              northeast: { lat: -6.0744, lng: 106.9758 },
              southwest: { lat: -6.3676, lng: 106.6924 }
            },
            area: 664.01,
            elevation: 8
          },
          postalCodes: ["10110", "10120", "10130", "10140", "10150"],
          timezone: "Asia/Jakarta",
          utcOffset: "+07:00",
          statistics: {
            totalSpaces: 45,
            activeSpaces: 42
          },
          businessInfo: {
            isServiceAvailable: true,
            launchDate: "2024-01-15",
            supportedBrands: ["NextSpace", "UnionSpace"],
            currency: "IDR",
            taxRate: 0.11
          },
          display: {
            featured: true,
            order: 1,
            heroImage: "https://storage.googleapis.com/bucket/jakarta-hero.jpg",
            thumbnailImage: "https://storage.googleapis.com/bucket/jakarta-thumb.jpg",
            description: "Indonesia's bustling capital city with modern co-working spaces",
            descriptionEn: "Indonesia's bustling capital city with modern co-working spaces",
            tags: ["metropolitan", "business-hub", "technology"]
          },
          search: {
            keywords: ["jakarta", "dki", "capital", "indonesia"],
            aliases: ["JKT", "Djakarta", "Batavia"],
            slug: "jakarta",
            metaTitle: "Co-working Spaces in Jakarta - NextSpace & UnionSpace",
            metaDescription: "Find and book the best co-working spaces in Jakarta"
          },
          isActive: true,
          isPopular: true,
          hasAirport: true,
          hasPublicTransport: true
        },
        {
          cityId: "BDG001",
          name: "Bandung",
          country: {
            id: "ID",
            name: "Indonesia",
            code: "IDN",
            phoneCode: "+62"
          },
          location: {
            coordinates: new admin.firestore.GeoPoint(-6.9175, 107.6191),
            latitude: -6.9175,
            longitude: 107.6191,
            boundingBox: {
              northeast: { lat: -6.8000, lng: 107.7500 },
              southwest: { lat: -7.0500, lng: 107.4500 }
            },
            area: 167.31,
            elevation: 768
          },
          postalCodes: ["40111", "40112", "40113", "40114", "40115"],
          timezone: "Asia/Jakarta",
          utcOffset: "+07:00",
          statistics: {
            totalSpaces: 25,
            activeSpaces: 23
          },
          businessInfo: {
            isServiceAvailable: true,
            launchDate: "2024-02-01",
            supportedBrands: ["NextSpace", "UnionSpace"],
            currency: "IDR",
            taxRate: 0.11
          },
          display: {
            featured: true,
            order: 2,
            heroImage: "https://storage.googleapis.com/bucket/bandung-hero.jpg",
            thumbnailImage: "https://storage.googleapis.com/bucket/bandung-thumb.jpg",
            description: "Creative city with vibrant startup ecosystem and modern workspaces",
            descriptionEn: "Creative city with vibrant startup ecosystem and modern workspaces",
            tags: ["creative", "startup", "technology", "cool-weather"]
          },
          search: {
            keywords: ["bandung", "paris van java", "west java"],
            aliases: ["BDG", "Paris van Java"],
            slug: "bandung",
            metaTitle: "Co-working Spaces in Bandung - NextSpace & UnionSpace",
            metaDescription: "Discover modern co-working spaces in Bandung's creative district"
          },
          isActive: true,
          isPopular: true,
          hasAirport: false,
          hasPublicTransport: true
        },
        {
          cityId: "SBY001",
          name: "Surabaya",
          country: {
            id: "ID",
            name: "Indonesia",
            code: "IDN",
            phoneCode: "+62"
          },
          location: {
            coordinates: new admin.firestore.GeoPoint(-7.2575, 112.7521),
            latitude: -7.2575,
            longitude: 112.7521,
            boundingBox: {
              northeast: { lat: -7.1000, lng: 112.9000 },
              southwest: { lat: -7.4000, lng: 112.6000 }
            },
            area: 333.063,
            elevation: 3
          },
          postalCodes: ["60111", "60112", "60113", "60114", "60115"],
          timezone: "Asia/Jakarta",
          utcOffset: "+07:00",
          statistics: {
            totalSpaces: 19,
            activeSpaces: 17
          },
          businessInfo: {
            isServiceAvailable: true,
            launchDate: "2024-03-01",
            supportedBrands: ["NextSpace", "UnionSpace"],
            currency: "IDR",
            taxRate: 0.11
          },
          display: {
            featured: false,
            order: 3,
            heroImage: "https://storage.googleapis.com/bucket/surabaya-hero.jpg",
            thumbnailImage: "https://storage.googleapis.com/bucket/surabaya-thumb.jpg",
            description: "Eastern Java's business hub with growing co-working community",
            descriptionEn: "Eastern Java's business hub with growing co-working community",
            tags: ["business", "port-city", "industrial"]
          },
          search: {
            keywords: ["surabaya", "east java", "heroes city"],
            aliases: ["SBY", "Kota Pahlawan"],
            slug: "surabaya",
            metaTitle: "Co-working Spaces in Surabaya - NextSpace & UnionSpace",
            metaDescription: "Professional workspaces in Surabaya's business district"
          },
          isActive: true,
          isPopular: false,
          hasAirport: true,
          hasPublicTransport: true
        }
      ],

      layanan: [
        {
          serviceId: "SVC001",
          name: "Virtual Office",
          slug: "virtual-office",
          category: "office",
          type: "virtual-office",
          description: {
            short: "Alamat bisnis prestisius tanpa perlu sewa kantor fisik",
            long: "Solusi virtual office yang memberikan alamat bisnis prestisius di lokasi strategis, lengkap dengan layanan mail handling, telephone answering, dan akses meeting room sesuai kebutuhan.",
            shortEn: "Prestigious business address without physical office rental",
            longEn: "Virtual office solution providing prestigious business address in strategic location, complete with mail handling, telephone answering, and meeting room access as needed."
          },
          metrics: {
            totalSubscribers: 245,
            activeSubscribers: 198,
            monthlySignups: 23,
            churnRate: 5.2,
            averageLifetimeValue: 1800000,
            customerSatisfactionScore: 4.6,
            netPromoterScore: 72
          },
          status: "published"
        },
        {
          serviceId: "SVC002",
          name: "Private Office",
          slug: "private-office",
          category: "office",
          type: "private-office",
          description: {
            short: "Ruang kantor privat eksklusif untuk tim dan bisnis",
            long: "Kantor privat yang fully furnished dengan fasilitas lengkap, akses 24/7, dan layanan pendukung bisnis. Ideal untuk startup hingga enterprise yang membutuhkan ruang kerja dedicated.",
            shortEn: "Exclusive private office space for teams and businesses",
            longEn: "Fully furnished private office with complete facilities, 24/7 access, and business support services. Ideal for startups to enterprises needing dedicated workspace."
          },
          metrics: {
            totalSubscribers: 156,
            activeSubscribers: 142,
            monthlySignups: 18,
            churnRate: 3.8,
            averageLifetimeValue: 5200000,
            customerSatisfactionScore: 4.8,
            netPromoterScore: 81
          },
          status: "published"
        },
        {
          serviceId: "SVC003",
          name: "Meeting Room",
          slug: "meeting-room",
          category: "workspace",
          type: "meeting-room",
          description: {
            short: "Ruang meeting profesional dengan fasilitas presentasi lengkap",
            long: "Ruang meeting yang dilengkapi dengan fasilitas audio visual modern, high-speed internet, dan layanan catering. Tersedia dalam berbagai kapasitas untuk kebutuhan meeting, training, atau workshop.",
            shortEn: "Professional meeting rooms with complete presentation facilities",
            longEn: "Meeting rooms equipped with modern audio-visual facilities, high-speed internet, and catering services. Available in various capacities for meetings, training, or workshops."
          },
          metrics: {
            totalSubscribers: 89,
            activeSubscribers: 76,
            monthlySignups: 12,
            churnRate: 8.1,
            averageLifetimeValue: 850000,
            customerSatisfactionScore: 4.5,
            netPromoterScore: 68
          },
          status: "published"
        },
        {
          serviceId: "SVC004",
          name: "Coworking Space",
          slug: "coworking-space",
          category: "workspace",
          type: "coworking-space",
          description: {
            short: "Area kerja bersama dengan suasana kolaboratif dan networking",
            long: "Ruang kerja bersama yang dirancang untuk mendorong kolaborasi dan networking. Dilengkapi dengan hot desk, dedicated desk, dan area common yang nyaman untuk bekerja dan berinteraksi.",
            shortEn: "Collaborative workspace with networking atmosphere",
            longEn: "Shared workspace designed to encourage collaboration and networking. Equipped with hot desks, dedicated desks, and comfortable common areas for work and interaction."
          },
          metrics: {
            totalSubscribers: 324,
            activeSubscribers: 298,
            monthlySignups: 45,
            churnRate: 6.7,
            averageLifetimeValue: 1200000,
            customerSatisfactionScore: 4.7,
            netPromoterScore: 75
          },
          status: "published"
        },
        {
          serviceId: "SVC005",
          name: "Event Space",
          slug: "event-space",
          category: "event",
          type: "event-space",
          description: {
            short: "Ruang acara berkapasitas besar untuk seminar dan konferensi",
            long: "Space untuk event dengan kapasitas hingga 200 orang, dilengkapi dengan sound system profesional, stage, dan layanan event management. Cocok untuk seminar, konferensi, product launch, dan gathering.",
            shortEn: "Large capacity event space for seminars and conferences",
            longEn: "Event space with capacity up to 200 people, equipped with professional sound system, stage, and event management services. Perfect for seminars, conferences, product launches, and gatherings."
          },
          metrics: {
            totalSubscribers: 67,
            activeSubscribers: 58,
            monthlySignups: 8,
            churnRate: 4.2,
            averageLifetimeValue: 3500000,
            customerSatisfactionScore: 4.9,
            netPromoterScore: 85
          },
          status: "published"
        },
        {
          serviceId: "SVC006",
          name: "Legalitas Bisnis",
          slug: "legalitas-bisnis",
          category: "business-support",
          type: "business-legality",
          description: {
            short: "Layanan bantuan legalitas dan perizinan bisnis",
            long: "Layanan konsultasi dan pengurusan legalitas bisnis mulai dari pendirian PT, CV, perizinan usaha, hingga compliance perpajakan. Didukung oleh tim legal berpengalaman.",
            shortEn: "Business legality and licensing assistance services",
            longEn: "Business legality consultation and processing services from PT/CV establishment, business permits, to tax compliance. Supported by experienced legal team."
          },
          metrics: {
            totalSubscribers: 134,
            activeSubscribers: 128,
            monthlySignups: 15,
            churnRate: 2.1,
            averageLifetimeValue: 2800000,
            customerSatisfactionScore: 4.8,
            netPromoterScore: 82
          },
          status: "published"
        }
      ],

      spaces: [
        {
          spaceId: "space_001",
          name: "NextSpace Jakarta Central",
          description: "Modern co-working space in the heart of Jakarta's business district",
          brand: "NextSpace",
          category: "co-working",
          location: {
            address: "Jl. Sudirman No. 123, Jakarta Pusat",
            city: "Jakarta",
            province: "DKI Jakarta",
            postalCode: "10220",
            country: "Indonesia",
            coordinates: new admin.firestore.GeoPoint(-6.2088, 106.8456),
            latitude: -6.2088,
            longitude: 106.8456
          },
          capacity: 50,
          amenities: ["High-speed WiFi", "Air Conditioning", "Projector", "Whiteboard", "Coffee/Tea", "Printer", "Security"],
          spaceType: "open-space",
          pricing: {
            hourly: 50000,
            daily: 300000,
            monthly: 2000000,
            currency: "IDR"
          },
          isActive: true,
          operatingHours: {
            monday: { open: "08:00", close: "22:00" },
            tuesday: { open: "08:00", close: "22:00" },
            wednesday: { open: "08:00", close: "22:00" },
            thursday: { open: "08:00", close: "22:00" },
            friday: { open: "08:00", close: "22:00" },
            saturday: { open: "09:00", close: "18:00" },
            sunday: { open: "09:00", close: "18:00" }
          },
          images: [
            "https://storage.googleapis.com/bucket/nextspace-jkt-1.jpg",
            "https://storage.googleapis.com/bucket/nextspace-jkt-2.jpg"
          ],
          thumbnail: "https://storage.googleapis.com/bucket/nextspace-jkt-thumb.jpg"
        },
        {
          spaceId: "space_002",
          name: "UnionSpace Jakarta Premium",
          description: "Premium private office suite with city view",
          brand: "UnionSpace",
          category: "private-office",
          location: {
            address: "Jl. Thamrin No. 456, Jakarta Pusat",
            city: "Jakarta",
            province: "DKI Jakarta",
            postalCode: "10230",
            country: "Indonesia",
            coordinates: new admin.firestore.GeoPoint(-6.1944, 106.8229),
            latitude: -6.1944,
            longitude: 106.8229
          },
          capacity: 8,
          amenities: ["High-speed WiFi", "Air Conditioning", "Smart TV", "Conference Table", "Coffee Machine", "Parking", "Reception"],
          spaceType: "private-room",
          pricing: {
            hourly: 200000,
            daily: 1200000,
            monthly: 8000000,
            currency: "IDR"
          },
          isActive: true,
          operatingHours: {
            monday: { open: "24/7", close: "24/7" },
            tuesday: { open: "24/7", close: "24/7" },
            wednesday: { open: "24/7", close: "24/7" },
            thursday: { open: "24/7", close: "24/7" },
            friday: { open: "24/7", close: "24/7" },
            saturday: { open: "24/7", close: "24/7" },
            sunday: { open: "24/7", close: "24/7" }
          },
          images: [
            "https://storage.googleapis.com/bucket/unionspace-jkt-1.jpg",
            "https://storage.googleapis.com/bucket/unionspace-jkt-2.jpg"
          ],
          thumbnail: "https://storage.googleapis.com/bucket/unionspace-jkt-thumb.jpg"
        },
        {
          spaceId: "space_003",
          name: "NextSpace Bandung Creative Hub",
          description: "Creative workspace in Bandung's tech district",
          brand: "NextSpace",
          category: "co-working",
          location: {
            address: "Jl. Dago No. 789, Bandung",
            city: "Bandung",
            province: "Jawa Barat",
            postalCode: "40135",
            country: "Indonesia",
            coordinates: new admin.firestore.GeoPoint(-6.9175, 107.6191),
            latitude: -6.9175,
            longitude: 107.6191
          },
          capacity: 35,
          amenities: ["High-speed WiFi", "Air Conditioning", "Projector", "Whiteboard", "Coffee/Tea", "Game Area"],
          spaceType: "open-space",
          pricing: {
            hourly: 35000,
            daily: 200000,
            monthly: 1500000,
            currency: "IDR"
          },
          isActive: true,
          operatingHours: {
            monday: { open: "08:00", close: "21:00" },
            tuesday: { open: "08:00", close: "21:00" },
            wednesday: { open: "08:00", close: "21:00" },
            thursday: { open: "08:00", close: "21:00" },
            friday: { open: "08:00", close: "21:00" },
            saturday: { open: "09:00", close: "17:00" },
            sunday: { open: "10:00", close: "16:00" }
          },
          images: [
            "https://storage.googleapis.com/bucket/nextspace-bdg-1.jpg",
            "https://storage.googleapis.com/bucket/nextspace-bdg-2.jpg"
          ],
          thumbnail: "https://storage.googleapis.com/bucket/nextspace-bdg-thumb.jpg"
        },
        {
          spaceId: "space_004",
          name: "Meeting Room Alpha",
          description: "Professional meeting room for presentations and conferences",
          brand: "UnionSpace",
          category: "meeting-room",
          location: {
            address: "Jl. Sudirman No. 123, Jakarta Pusat",
            city: "Jakarta",
            province: "DKI Jakarta",
            postalCode: "10220",
            country: "Indonesia",
            coordinates: new admin.firestore.GeoPoint(-6.2088, 106.8456),
            latitude: -6.2088,
            longitude: 106.8456
          },
          capacity: 12,
          amenities: ["4K Projector", "Video Conference", "Whiteboard", "Sound System", "Climate Control", "Catering Service"],
          spaceType: "meeting-room",
          pricing: {
            hourly: 150000,
            daily: 900000,
            monthly: 5000000,
            currency: "IDR"
          },
          isActive: true,
          operatingHours: {
            monday: { open: "08:00", close: "22:00" },
            tuesday: { open: "08:00", close: "22:00" },
            wednesday: { open: "08:00", close: "22:00" },
            thursday: { open: "08:00", close: "22:00" },
            friday: { open: "08:00", close: "22:00" },
            saturday: { open: "09:00", close: "18:00" },
            sunday: { open: "10:00", close: "17:00" }
          },
          images: [
            "https://storage.googleapis.com/bucket/meeting-alpha-1.jpg",
            "https://storage.googleapis.com/bucket/meeting-alpha-2.jpg"
          ],
          thumbnail: "https://storage.googleapis.com/bucket/meeting-alpha-thumb.jpg"
        }
      ]
    };
  }

  async seedCollection(collectionName, data, idField = null) {
    try {
      console.log(`\n🌱 Seeding ${collectionName} with ${data.length} documents...`);
      const batch = db.batch();
      
      data.forEach((item) => {
        let docRef;
        if (idField && item[idField]) {
          // Use custom ID if provided
          docRef = db.collection(collectionName).doc(item[idField]);
        } else {
          // Use auto-generated ID
          docRef = db.collection(collectionName).doc();
        }
        
        // Add timestamps
        const docData = {
          ...item,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: "seeder_script"
        };
        
        batch.set(docRef, docData);
      });
      
      await batch.commit();
      console.log(`✅ Successfully seeded ${data.length} documents to ${collectionName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error seeding ${collectionName}:`, error);
      throw error;
    }
  }

  async clearCollection(collectionName) {
    try {
      console.log(`🗑️  Clearing ${collectionName}...`);
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error clearing ${collectionName}:`, error);
      throw error;
    }
  }

  async seedAll(options = { clearFirst: false }) {
    try {
      console.log('\n🚀 Starting Reference-Based Database Seeding...');
      console.log('================================================');
      
      const collections = [
        { name: 'cities', data: this.sampleData.cities, idField: 'cityId' },
        { name: 'layanan', data: this.sampleData.layanan, idField: 'serviceId' },
        { name: 'spaces', data: this.sampleData.spaces, idField: 'spaceId' }
      ];

      for (const collection of collections) {
        if (options.clearFirst) {
          await this.clearCollection(collection.name);
        }
        await this.seedCollection(collection.name, collection.data, collection.idField);
      }

      console.log('\n🎉 Reference-based database seeding completed successfully!');
      console.log('=========================================================');
      
      // Show summary
      console.log('\n📊 Summary:');
      console.log(`🏙️  Cities: ${this.sampleData.cities.length} documents`);
      console.log(`⚙️  Layanan: ${this.sampleData.layanan.length} documents`);
      console.log(`🏢 Spaces: ${this.sampleData.spaces.length} documents`);
      
      return true;
    } catch (error) {
      console.error('\n💥 Reference-based database seeding failed:', error);
      throw error;
    }
  }

  async validateStructure() {
    try {
      console.log('\n🔍 Validating database structure...');
      
      const collections = ['cities', 'layanan', 'spaces'];
      const results = {};
      
      for (const collection of collections) {
        try {
          const snapshot = await db.collection(collection).limit(5).get();
          results[collection] = {
            exists: true,
            documentCount: snapshot.size,
            hasData: !snapshot.empty
          };
          
          if (!snapshot.empty) {
            const sampleDoc = snapshot.docs[0].data();
            console.log(`✅ ${collection}: ${snapshot.size} documents found`);
            console.log(`   Sample fields: ${Object.keys(sampleDoc).slice(0, 5).join(', ')}...`);
          } else {
            console.log(`⚠️  ${collection}: Collection exists but is empty`);
          }
        } catch (error) {
          results[collection] = {
            exists: false,
            error: error.message
          };
          console.log(`❌ ${collection}: ${error.message}`);
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Structure validation failed:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  try {
    const seeder = new RefBasedDatabaseSeeder();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const clearFirst = args.includes('--clear') || args.includes('-c');
    const validateOnly = args.includes('--validate') || args.includes('-v');
    
    if (validateOnly) {
      await seeder.validateStructure();
    } else {
      await seeder.seedAll({ clearFirst });
      await seeder.validateStructure();
    }
    
    console.log('\n✨ Reference-based database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = RefBasedDatabaseSeeder;

// Run if called directly
if (require.main === module) {
  main();
} 