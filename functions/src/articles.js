const {onRequest} = require('firebase-functions/v2/https');
const cors = require('cors')({origin: true});
const {
  getDb,
  verifyAdminAuth,
} = require('./utils/helpers');
const {
  handleResponse,
  handleError,
  handleValidationError,
  handleAuthError,
} = require('./utils/errorHandler');
const {uploadImageFromBase64, deleteImage} = require('./services/imageService');
const {applyWriteOperationRateLimit} = require('./utils/applyRateLimit');

// Enhanced validation function for articles
function validateArticleData(data, isUpdate = false) {
  const errors = [];

  // Basic required fields validation
  if (!isUpdate && !data.title) errors.push('Title is required');
  if (!isUpdate && !data.content) errors.push('Content is required');

  // Title validation
  if (data.title && (data.title.length < 2 || data.title.length > 200)) {
    errors.push('Title must be between 2 and 200 characters');
  }

  // Content validation
  if (data.content && data.content.length < 10) {
    errors.push('Content must be at least 10 characters');
  }

  // Excerpt validation
  if (data.excerpt && data.excerpt.length > 500) {
    errors.push('Excerpt must be less than 500 characters');
  }

  // Author validation
  if (data.author && data.author.length > 100) {
    errors.push('Author name must be less than 100 characters');
  }

  // Category validation
  if (data.category && data.category.length > 50) {
    errors.push('Category must be less than 50 characters');
  }

  // Status validation
  if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
    errors.push('Status must be either "draft", "published", or "archived"');
  }

  // Tags validation
  if (data.tags && (!Array.isArray(data.tags) || data.tags.length > 10)) {
    errors.push('Tags must be an array with maximum 10 items');
  }

  return errors;
}

// Enhanced data sanitization function for articles
function sanitizeArticleData(data) {
  const sanitized = {};

  // Sanitize strings
  if (data.title) sanitized.title = data.title.trim();
  if (data.excerpt) sanitized.excerpt = data.excerpt.trim();
  if (data.content) sanitized.content = data.content.trim();
  if (data.author) sanitized.author = data.author.trim();
  if (data.category) sanitized.category = data.category.trim();
  if (data.featuredImage) sanitized.featuredImage = data.featuredImage.trim();

  // Boolean values
  if (data.isFeatured !== undefined) {
    sanitized.isFeatured = Boolean(data.isFeatured);
  }

  // Status
  if (data.status) {
    sanitized.status = data.status.trim();
  }

  // Tags array
  if (data.tags && Array.isArray(data.tags)) {
    sanitized.tags = data.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  }

  // Dates
  if (data.publishedAt) {
    sanitized.publishedAt = new Date(data.publishedAt);
  }

  return sanitized;
}

// Generate sequential article ID
async function generateSequentialArticleId() {
  try {
    const db = getDb();
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('articles');

    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let lastId = 1;
      let currentYear = year;

      if (counterDoc.exists) {
        const data = counterDoc.data();
        lastId = data.lastId + 1;
        currentYear = data.year;

        // Reset counter if year changed
        if (currentYear !== year) {
          lastId = 1;
          currentYear = year;
        }
      }

      const yearSuffix = year.toString().slice(-2);
      const sequence = String(lastId).padStart(4, '0');
      const articleId = `ART${yearSuffix}${sequence}`;

      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date(),
      });

      return articleId;
    });

    console.log(`✅ Generated sequential article ID: ${result}`);
    return result;
  } catch (error) {
    console.error('Error generating sequential article ID:', error);
    const fallbackId = `ART${Date.now().toString().slice(-6)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// Generate search keywords for articles
function generateArticleSearchKeywords(articleData) {
  const keywords = [];

  // Add title keywords
  if (articleData.title) {
    keywords.push(articleData.title.toLowerCase());
    keywords.push(...articleData.title.toLowerCase().split(' '));
  }

  // Add author keywords
  if (articleData.author) {
    keywords.push(articleData.author.toLowerCase());
    keywords.push(...articleData.author.toLowerCase().split(' '));
  }

  // Add category keywords
  if (articleData.category) {
    keywords.push(articleData.category.toLowerCase());
  }

  // Add tags keywords
  if (articleData.tags && Array.isArray(articleData.tags)) {
    keywords.push(...articleData.tags.map((tag) => tag.toLowerCase()));
  }

  // Add excerpt keywords
  if (articleData.excerpt) {
    const excerptWords = articleData.excerpt.toLowerCase().split(' ').filter((word) => word.length > 2);
    keywords.push(...excerptWords.slice(0, 15)); // Limit to first 15 meaningful words
  }

  // Add content keywords (first 100 words)
  if (articleData.content) {
    const contentWords = articleData.content.toLowerCase().split(' ').filter((word) => word.length > 3);
    keywords.push(...contentWords.slice(0, 20)); // Limit to first 20 meaningful words
  }

  // Remove duplicates and empty strings
  return [...new Set(keywords.filter((keyword) => keyword && keyword.length > 0))];
}

// Main articles function
const articles = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Apply rate limiting for write operations
      if (!applyWriteOperationRateLimit(req, res)) {
        return; // Rate limit exceeded, response already sent
      }

      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);
      if (pathParts[0] === 'api') pathParts.shift();
      // NEW: normalize path
      if (pathParts[0] === 'articles') pathParts.shift();

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllArticles(req, res);
        } else if (pathParts.length === 1) {
          return await getArticleById(pathParts[0], req, res);
        }
      } else if (method === 'POST') {
        // Require admin auth for all POST operations
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }

        if (pathParts.length === 0) {
          return await createArticle(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'upload-image') {
          return await uploadArticleImage(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /articles/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await updateArticle(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /articles/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await deleteArticle(pathParts[0], req, res);
      }

      return handleError(res, new Error('Article route not found'), 404, req);
    } catch (error) {
      return handleError(res, error, 500, req);
    }
  });
});

// GET /articles
const getAllArticles = async (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
      author = '',
      isFeatured = '',
      sortBy = 'metadata.createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    let query = db.collection('articles');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (author) {
      query = query.where('author', '==', author);
    }

    if (isFeatured !== '') {
      query = query.where('isFeatured', '==', isFeatured === 'true');
    }

    // Apply search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.where('searchKeywords', 'array-contains', searchLower);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    const snapshot = await query.get();
    const articles = [];

    snapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedArticles = articles.slice(offset, offset + parseInt(limit));

    handleResponse(res, {
      articles: paginatedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: articles.length,
        totalPages: Math.ceil(articles.length / parseInt(limit)),
      },
      total: articles.length,
    });
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// GET /articles/:id
const getArticleById = async (articleId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('articles').doc(articleId).get();

    if (!doc.exists) {
      return handleError(res, new Error('Article not found'), 404, req);
    }

    handleResponse(res, {id: doc.id, ...doc.data()});
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// POST /articles
const createArticle = async (req, res) => {
  try {
    const db = getDb();
    console.log('🎯 POST /articles - Request received');

    // Validate data
    const validationErrors = validateArticleData(req.body);
    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return handleValidationError(res, validationErrors.map((error) => ({message: error})), req);
    }

    // Sanitize data
    const sanitizedData = sanitizeArticleData(req.body);

    // Generate article ID
    const articleId = await generateSequentialArticleId();

    // Prepare article data
    const articleData = {
      articleId,
      ...sanitizedData,
      searchKeywords: generateArticleSearchKeywords(sanitizedData),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      status: sanitizedData.status || 'draft',
      isFeatured: sanitizedData.isFeatured !== undefined ? sanitizedData.isFeatured : false,
    };

    // Set publishedAt if status is published and not already set
    if (articleData.status === 'published' && !articleData.publishedAt) {
      articleData.publishedAt = new Date();
    }

    console.log('💾 Saving article data:', JSON.stringify(articleData, null, 2));

    // Save to Firestore using structured ID as document ID
    await db.collection('articles').doc(articleId).set(articleData);

    console.log(`✅ Article created successfully with ID: ${articleId}`);

    handleResponse(res, {
      id: articleId,
      ...articleData,
    }, 201);
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// PUT /articles/:id
const updateArticle = async (articleId, req, res) => {
  try {
    const db = getDb();
    console.log(`🎯 PUT /articles/${articleId} - Request received`);

    const articleDoc = await db.collection('articles').doc(articleId).get();
    if (!articleDoc.exists) {
      return handleError(res, new Error('Article not found'), 404, req);
    }

    // Validate data
    const validationErrors = validateArticleData(req.body, true);
    if (validationErrors.length > 0) {
      return handleValidationError(res, validationErrors.map((error) => ({message: error})), req);
    }

    // Sanitize data
    const sanitizedData = sanitizeArticleData(req.body);
    const existingData = articleDoc.data();

    // If status changes to published and no publishedAt set, set it now
    if (sanitizedData.status === 'published' && existingData.status !== 'published' && !sanitizedData.publishedAt) {
      sanitizedData.publishedAt = new Date();
    }

    // Prepare update data
    const updateData = {
      ...sanitizedData,
      searchKeywords: generateArticleSearchKeywords({
        ...existingData,
        ...sanitizedData,
      }),
      metadata: {
        ...existingData.metadata,
        updatedAt: new Date(),
        version: (existingData.metadata?.version || 1) + 1,
      },
    };

    // Update in Firestore
    await db.collection('articles').doc(articleId).update(updateData);

    // Get updated article
    const updatedDoc = await db.collection('articles').doc(articleId).get();
    const updatedArticle = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    handleResponse(res, updatedArticle);
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// DELETE /articles/:id
const deleteArticle = async (articleId, req, res) => {
  try {
    const db = getDb();

    const articleDoc = await db.collection('articles').doc(articleId).get();
    if (!articleDoc.exists) {
      return handleError(res, new Error('Article not found'), 404, req);
    }

    const articleData = articleDoc.data();

    // Delete associated image if exists
    if (articleData.featuredImage) {
      await deleteImage(articleData.featuredImage);
    }

    await db.collection('articles').doc(articleId).delete();

    handleResponse(res, {message: 'Article deleted successfully'});
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// POST /articles/:id/upload-image
const uploadArticleImage = async (articleId, req, res) => {
  try {
    const db = getDb();
    const {imageData, fileName} = req.body;

    if (!imageData) {
      return handleValidationError(res, [{message: 'No image data provided'}], req);
    }

    // Check if article exists
    const articleDoc = await db.collection('articles').doc(articleId).get();
    if (!articleDoc.exists) {
      return handleError(res, new Error('Article not found'), 404, req);
    }

    const articleData = articleDoc.data();

    // Delete existing image if any
    if (articleData.featuredImage) {
      await deleteImage(articleData.featuredImage);
    }

    // Upload new image
    const uploadResult = await uploadImageFromBase64(
        imageData,
        fileName || `article_${articleId}`,
        'articles',
    );

    // Update article document with new image URL
    await db.collection('articles').doc(articleId).update({
      featuredImage: uploadResult.url,
      metadata: {
        ...articleData.metadata,
        updatedAt: new Date(),
        version: (articleData.metadata?.version || 1) + 1,
      },
    });

    console.log(`✅ Successfully updated article ${articleId} with image: ${uploadResult.url}`);

    handleResponse(res, {
      featuredImage: uploadResult.url,
      filename: uploadResult.filename,
    });
  } catch (error) {
    console.error('Error uploading article image:', error);
    handleError(res, error);
  }
};

module.exports = {articles};
