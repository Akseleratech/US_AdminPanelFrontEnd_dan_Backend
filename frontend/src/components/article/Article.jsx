import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, FileText, Star, User, FolderOpen, Calendar, Eye } from 'lucide-react';
import { articlesAPI } from '../../services/api';
import ArticleModal from './ArticleModal';
import ArticlesTable from './ArticlesTable';
import LoadingSpinner from '../common/LoadingSpinner';

const Article = () => {
  // Data state
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    author: '',
    isFeatured: '',
    sortBy: 'metadata.createdAt',
    sortOrder: 'desc'
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    featured: 0
  });

  // Load articles on component mount
  useEffect(() => {
    loadArticles();
  }, [filters]);

  // Load articles from API
  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getAll(filters);
      
      if (response.articles) {
        setArticles(response.articles);
        
        // Calculate stats
        const stats = {
          total: response.total || response.articles.length,
          published: response.articles.filter(a => a.status === 'published').length,
          draft: response.articles.filter(a => a.status === 'draft').length,
          archived: response.articles.filter(a => a.status === 'archived').length,
          featured: response.articles.filter(a => a.isFeatured).length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadArticles();
    setRefreshing(false);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  // Handle create new article
  const handleCreateNew = () => {
    setEditingArticle(null);
    setShowModal(true);
  };

  // Handle edit article
  const handleEdit = (article) => {
    setEditingArticle(article);
    setShowModal(true);
  };

  // Handle delete article
  const handleDelete = async (article) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus article "${article.title}"?`)) {
      return;
    }

    try {
      await articlesAPI.delete(article.id);
      await loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Gagal menghapus article. Silakan coba lagi.');
    }
  };

  // Handle modal save
  const handleModalSave = async () => {
    await loadArticles();
  };

  // Get unique categories from articles
  const getCategories = () => {
    const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
    return categories.sort();
  };

  // Get unique authors from articles
  const getAuthors = () => {
    const authors = [...new Set(articles.map(a => a.author).filter(Boolean))];
    return authors.sort();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      author: '',
      isFeatured: '',
      sortBy: 'metadata.createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Article Management</h1>
          <p className="text-gray-600 mt-1">
            Kelola artikel dan berita untuk website dan aplikasi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Article
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Article</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.published}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-yellow-800">D</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-800">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Archived</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.archived}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Featured</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.featured}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari article..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Kategori</option>
              {getCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <select
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Penulis</option>
              {getAuthors().map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <select
              value={filters.isFeatured}
              onChange={(e) => handleFilterChange('isFeatured', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.search || filters.status || filters.category || filters.author || filters.isFeatured) && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filter aktif:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {filters.search}
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {filters.status}
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Category: {filters.category}
              </span>
            )}
            {filters.author && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Author: {filters.author}
              </span>
            )}
            {filters.isFeatured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Featured: {filters.isFeatured === 'true' ? 'Ya' : 'Tidak'}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ArticlesTable
          articles={articles}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <ArticleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        article={editingArticle}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default Article; 