const { db } = require('../config/firebase');

async function updateExistingSpaces() {
  console.log('🔄 Updating existing spaces with enhanced fields...\n');

  try {
    const spacesSnapshot = await db.collection('spaces').get();
    
    if (spacesSnapshot.empty) {
      console.log('No spaces found to update.');
      return;
    }

    let updatedCount = 0;
    const batch = db.batch();

    spacesSnapshot.forEach(doc => {
      const spaceData = doc.data();
      const spaceRef = doc.ref;
      
      // Generate search keywords
      const keywords = [];
      if (spaceData.name) keywords.push(...spaceData.name.toLowerCase().split(' '));
      if (spaceData.brand) keywords.push(spaceData.brand.toLowerCase());
      if (spaceData.category) keywords.push(spaceData.category.toLowerCase());
      if (spaceData.spaceType) keywords.push(spaceData.spaceType.toLowerCase());
      if (spaceData.location?.city) keywords.push(spaceData.location.city.toLowerCase());
      if (spaceData.location?.province) keywords.push(spaceData.location.province.toLowerCase());
      if (spaceData.amenities) keywords.push(...spaceData.amenities.map(a => a.toLowerCase()));
      
      // Remove duplicates and empty strings
      const searchKeywords = [...new Set(keywords.filter(k => k && k.length > 1))];
      
      // Generate slug
      const slug = spaceData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `space-${doc.id}`;
      
      // Calculate price range
      const pricing = spaceData.pricing || {};
      const prices = [pricing.hourly, pricing.daily, pricing.monthly].filter(p => p > 0);
      let priceRange = 'Unknown';
      
      if (prices.length === 0) {
        priceRange = 'Free';
      } else {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const currency = pricing.currency || 'IDR';
        
        if (min === max) {
          priceRange = `${currency} ${min.toLocaleString()}`;
        } else {
          priceRange = `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
        }
      }
      
      // Check coordinates
      const hasCoordinates = !!(spaceData.location?.latitude && spaceData.location?.longitude);
      
      // Prepare update data
      const updateData = {
        searchKeywords,
        slug,
        priceRange,
        hasCoordinates,
        version: spaceData.version || 1,
        updatedAt: new Date(),
        updatedBy: 'migration_script'
      };

      // Only update if missing fields
      const needsUpdate = !spaceData.searchKeywords || !spaceData.slug || !spaceData.priceRange || 
                         spaceData.hasCoordinates === undefined || !spaceData.version;

      if (needsUpdate) {
        batch.update(spaceRef, updateData);
        updatedCount++;
        
        console.log(`✅ Updating space: ${spaceData.name || doc.id}`);
        console.log(`   - Keywords: ${searchKeywords.length} generated`);
        console.log(`   - Slug: ${slug}`);
        console.log(`   - Price range: ${priceRange}`);
        console.log(`   - Has coordinates: ${hasCoordinates}`);
        console.log(`   - Version: ${updateData.version}`);
        console.log('');
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`🎉 Successfully updated ${updatedCount} spaces with enhanced fields!`);
    } else {
      console.log('✅ All spaces already have enhanced fields - no updates needed.');
    }

  } catch (error) {
    console.error('❌ Error updating spaces:', error);
    throw error;
  }
}

// Run the migration
updateExistingSpaces().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 