const admin = require("firebase-admin");
const { getDb } = require("./utils/helpers");

// Helper function to check if space is currently operational
const isSpaceOperational = (operationalHours) => {
  if (!operationalHours) return true; // If no operational hours set, assume always operational
  
  if (operationalHours.isAlwaysOpen) return true;
  
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
  const currentDay = jakartaTime.toLocaleDateString('en-US', {weekday: 'long'}).toLowerCase();
  const currentTime = jakartaTime.toTimeString().slice(0, 5); // HH:MM format
  
  const schedule = operationalHours.schedule;
  if (!schedule || !schedule[currentDay]) return false;
  
  const daySchedule = schedule[currentDay];
  if (!daySchedule.isOpen) return false;
  
  const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
  const openMinutes = parseInt(daySchedule.openTime.split(':')[0]) * 60 + parseInt(daySchedule.openTime.split(':')[1]);
  const closeMinutes = parseInt(daySchedule.closeTime.split(':')[0]) * 60 + parseInt(daySchedule.closeTime.split(':')[1]);
  
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

// Function to get operational status for a space
const getOperationalStatus = (space) => {
  const isOperational = isSpaceOperational(space.operationalHours);
  return {
    isOperational,
    effectiveStatus: space.isActive && isOperational,
    reason: !isOperational ? 'outside_operational_hours' : null
  };
};

// Function to update space operational status
const updateSpaceOperationalStatus = async (spaceId) => {
  try {
    const db = getDb();
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    
    if (!spaceDoc.exists) return false;
    
    const spaceData = spaceDoc.data();
    const operationalStatus = getOperationalStatus(spaceData);
    
    // Only update if there's a change needed
    if (spaceData.operationalStatus?.isOperational !== operationalStatus.isOperational) {
      await db.collection('spaces').doc(spaceId).update({
        operationalStatus: {
          isOperational: operationalStatus.isOperational,
          lastChecked: new Date(),
          reason: operationalStatus.reason
        },
        updatedAt: new Date()
      });
      
      console.log(`✅ Updated operational status for space ${spaceId}: ${operationalStatus.isOperational}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating operational status for space ${spaceId}:`, error);
    return false;
  }
};

// Function to update all spaces operational status
const updateAllSpacesOperationalStatus = async () => {
  try {
    const db = getDb();
    const spacesSnapshot = await db.collection('spaces').get();
    
    const updatePromises = [];
    spacesSnapshot.forEach(doc => {
      updatePromises.push(updateSpaceOperationalStatus(doc.id));
    });
    
    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter(result => result === true).length;
    
    console.log(`✅ Updated operational status for ${updatedCount} spaces`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error updating all spaces operational status:', error);
    throw error;
  }
};

module.exports = {
  isSpaceOperational,
  getOperationalStatus,
  updateSpaceOperationalStatus,
  updateAllSpacesOperationalStatus
}; 