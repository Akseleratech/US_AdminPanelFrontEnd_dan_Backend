const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "demo-unionspace-crm"
  });
}

const db = admin.firestore();

// Connect to emulator
db.settings({
  host: 'localhost:8088',
  ssl: false
});

async function analyzeServicesStructure() {
  try {
    console.log('🛠️ ANALYZING SERVICES DOCUMENT STRUCTURE');
    console.log('='.repeat(60));
    
    // Get all services
    console.log('📋 CURRENT SERVICES:');
    const servicesSnapshot = await db.collection('services').get();
    const services = [];
    
    if (servicesSnapshot.empty) {
      console.log('   📂 services/ (empty)');
      console.log('✅ No services found. Collection is ready for structured services.');
      return;
    }
    
    servicesSnapshot.forEach(doc => {
      const service = doc.data();
      services.push({
        docId: doc.id,
        serviceId: service.serviceId,
        name: service.name,
        category: service.category,
        isActive: service.isActive
      });
      
      console.log(`   🛠️ ${service.name || 'Unnamed'}`);
      console.log(`      Document ID: ${doc.id}`);
      console.log(`      Service ID: ${service.serviceId || 'undefined'}`);
      console.log(`      Category: ${service.category || 'undefined'}`);
      console.log(`      Active: ${service.isActive}`);
      console.log('      ---');
    });
    
    console.log(`\n📊 Total services: ${services.length}`);
    
    // Analyze ID structure
    console.log('\n🔍 ID STRUCTURE ANALYSIS:');
    console.log('='.repeat(60));
    
    const issues = [];
    const structured = [];
    
    services.forEach(service => {
      // Check if serviceId exists and is structured
      if (!service.serviceId) {
        issues.push({
          ...service,
          issue: 'Missing serviceId field'
        });
      } else {
        // Check if serviceId follows pattern (SRV + year + sequence)
        const isServiceIdStructured = service.serviceId.match(/^SRV\d{2}\d{3}$/);
        if (isServiceIdStructured) {
          structured.push(service);
        } else {
          issues.push({
            ...service,
            issue: 'serviceId not following structured format'
          });
        }
      }
      
      // Check document ID structure
      const docIdStructured = service.docId.match(/^SRV\d{2}\d{3}$/);
      if (!docIdStructured) {
        issues.push({
          ...service,
          issue: 'Document ID is random, should be structured'
        });
      }
    });
    
    console.log(`✅ Structured services: ${structured.length}`);
    structured.forEach(service => {
      console.log(`   🛠️ ${service.name} → ${service.serviceId} ✅`);
    });
    
    console.log(`\n🚨 Services with issues: ${issues.length}`);
    const uniqueIssues = Array.from(new Set(issues.map(i => `${i.docId}-${i.issue}`)))
      .map(key => issues.find(i => `${i.docId}-${i.issue}` === key));
    
    uniqueIssues.forEach(service => {
      console.log(`   🛠️ ${service.name}`);
      console.log(`      Issue: ${service.issue}`);
      console.log(`      Current doc ID: ${service.docId}`);
      console.log(`      Current service ID: ${service.serviceId || 'N/A'}`);
      console.log('      ---');
    });
    
    // Propose structured format
    console.log('\n💡 PROPOSED SERVICE ID STRUCTURE:');
    console.log('='.repeat(60));
    
    console.log('Format: SRV + Year + Sequence');
    console.log('Examples:');
    console.log('   SRV25001 → First service in 2025');
    console.log('   SRV25002 → Second service in 2025');
    console.log('   SRV25003 → Third service in 2025');
    console.log('');
    console.log('Optional category-based format:');
    console.log('   SRV25001 → Basic Office Services');
    console.log('   SRV25002 → Meeting Room Services');
    console.log('   SRV25003 → IT & Technology Services');
    
    // Recommend fixes
    console.log('\n🛠️ RECOMMENDED FIXES:');
    console.log('='.repeat(60));
    
    const servicesToFix = services.filter(s => 
      !s.serviceId || 
      !s.serviceId.match(/^SRV\d{2}\d{3}$/) ||
      !s.docId.match(/^SRV\d{2}\d{3}$/)
    );
    
    console.log(`Services to fix: ${servicesToFix.length}`);
    
    servicesToFix.forEach((service, index) => {
      const sequence = String(index + 1).padStart(3, '0');
      const proposedId = `SRV25${sequence}`;
      
      console.log(`   🛠️ ${service.name}`);
      console.log(`      Current doc ID: ${service.docId}`);
      console.log(`      Current service ID: ${service.serviceId || 'N/A'}`);
      console.log(`      Proposed ID: ${proposedId}`);
      console.log(`      Category: ${service.category || 'General'}`);
      console.log('      ---');
    });
    
    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`🛠️ Total services: ${services.length}`);
    console.log(`✅ Properly structured: ${structured.length}`);
    console.log(`🔧 Need fixing: ${servicesToFix.length}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Generate structured service IDs');
    console.log('2. Create new documents with structured IDs');
    console.log('3. Copy data to new documents');
    console.log('4. Delete old random ID documents');
    console.log('5. Verify folder structure is clean');
    
    return { services, structured, issues: servicesToFix };
    
  } catch (error) {
    console.error('❌ Error analyzing services structure:', error);
  }
}

// Run analysis
analyzeServicesStructure(); 