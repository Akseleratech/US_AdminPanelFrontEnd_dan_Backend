import React, { useState, useEffect } from 'react';
import { X, Upload, Image, AlertCircle, Tag, User, FolderOpen, RotateCcw, Star } from 'lucide-react';
import { articlesAPI } from '../../services/api';

const ArticleModal = ({ isOpen, onClose, article, onSave }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    tags: [],
    status: 'draft',
    isFeatured: false
  });

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  // Tags input state
  const [tagInput, setTagInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or article changes
  useEffect(() => {
    if (isOpen) {
      if (article) {
        // Edit mode
        setFormData({
          title: article.title || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          author: article.author || '',
          category: article.category || '',
          tags: article.tags || [],
          status: article.status || 'draft',
          isFeatured: article.isFeatured !== undefined ? article.isFeatured : false
        });
        setImagePreview(article.featuredImage || null);
      } else {
        // Create mode
        setFormData({
          title: '',
          excerpt: '',
          content: '',
          author: '',
          category: '',
          tags: [],
          status: 'draft',
          isFeatured: false
        });
        setImagePreview(null);
      }
      setImageFile(null);
      setTagInput('');
      setErrors({});
      setImageError('');
    }
  }, [isOpen, article]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle tags input
  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB');
      return;
    }

    setImageError('');
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(article?.featuredImage || null);
    setImageError('');
    
    // Reset file input
    const fileInput = document.getElementById('article-image-upload');
    if (fileInput) fileInput.value = '';
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2 || formData.title.length > 200) {
      newErrors.title = 'Title must be between 2 and 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    if (formData.excerpt && formData.excerpt.length > 500) {
      newErrors.excerpt = 'Excerpt must be less than 500 characters';
    }

    if (formData.author && formData.author.length > 100) {
      newErrors.author = 'Author name must be less than 100 characters';
    }

    if (formData.category && formData.category.length > 50) {
      newErrors.category = 'Category must be less than 50 characters';
    }

    if (!['draft', 'published', 'archived'].includes(formData.status)) {
      newErrors.status = 'Please select a valid status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let savedArticle;
      
      if (article) {
        // Update existing article
        savedArticle = await articlesAPI.update(article.id, formData);
      } else {
        // Create new article
        savedArticle = await articlesAPI.create(formData);
      }

      // Extract article ID from API wrapper or direct object
      const articleId = savedArticle?.data?.id || savedArticle?.data?.articleId || savedArticle?.id;

      // Upload image if selected
      if (imageFile && articleId) {
        setUploadingImage(true);
        try {
          await articlesAPI.uploadImage(articleId, imageFile);
        } catch (imageUploadError) {
          console.error('Image upload failed:', imageUploadError);
          setImageError('Failed to upload image. The article was saved without image.');
        } finally {
          setUploadingImage(false);
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving article:', error);
      if (error.message.includes('errors')) {
        const errorLines = error.message.split('\n');
        const newErrors = {};
        errorLines.forEach(line => {
          if (line.includes('Title')) newErrors.title = line.replace('• ', '');
          if (line.includes('Content')) newErrors.content = line.replace('• ', '');
          if (line.includes('Excerpt')) newErrors.excerpt = line.replace('• ', '');
          if (line.includes('Author')) newErrors.author = line.replace('• ', '');
          if (line.includes('Category')) newErrors.category = line.replace('• ', '');
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'text-green-600';
      case 'draft':
        return 'text-yellow-600';
      case 'archived':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-gray-50/50 z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {article ? 'Edit Article' : 'Tambah Article Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            disabled={loading || uploadingImage}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Judul Article <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan judul article"
              maxLength={200}
              disabled={loading || uploadingImage}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 karakter
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
              Ringkasan
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.excerpt ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ringkasan singkat article (opsional)"
              maxLength={500}
              disabled={loading || uploadingImage}
            />
            {errors.excerpt && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.excerpt}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.excerpt.length}/500 karakter
            </p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Konten Article <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={8}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Tulis konten article di sini..."
              disabled={loading || uploadingImage}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.content}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.content.length} karakter (minimal 10)
            </p>
          </div>

          {/* Author and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Penulis
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.author ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nama penulis"
                maxLength={100}
                disabled={loading || uploadingImage}
              />
              {errors.author && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.author}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                <FolderOpen className="inline h-4 w-4 mr-1" />
                Kategori
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Kategori article"
                maxLength={50}
                disabled={loading || uploadingImage}
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    disabled={loading || uploadingImage}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tambah tag (Enter atau koma untuk menambah)"
                disabled={loading || uploadingImage || formData.tags.length >= 10}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || uploadingImage || !tagInput.trim() || formData.tags.length >= 10}
              >
                Tambah
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.tags.length}/10 tags (gunakan Enter atau koma untuk memisahkan)
            </p>
          </div>

          {/* Status and Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-300' : 'border-gray-300'
                } ${getStatusColor(formData.status)}`}
                disabled={loading || uploadingImage}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.status}
                </p>
              )}
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading || uploadingImage}
              />
              <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700 flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                Featured Article
              </label>
            </div>
          </div>

          {/* Featured Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {imagePreview ? (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-48 object-contain rounded-lg"
                    />
                    {imageFile && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        New
                      </div>
                    )}
                  </div>
                  
                  {/* Image Actions */}
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('article-image-upload').click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                      disabled={loading || uploadingImage}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      disabled={loading || uploadingImage}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={() => document.getElementById('article-image-upload').click()} className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Klik untuk upload
                    </span> atau drag and drop
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG up to 5MB
                  </p>
                </div>
              )}
              
              <input
                id="article-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading || uploadingImage}
              />
            </div>

            {imageError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {imageError}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 pb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 ring-primary transition-all duration-200"
              disabled={loading || uploadingImage}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 ring-primary shadow-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {article ? 'Mengupdate...' : 'Menyimpan...'}
                </>
              ) : uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Upload Gambar...
                </>
              ) : (
                article ? 'Update Article' : 'Simpan Article'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleModal; 