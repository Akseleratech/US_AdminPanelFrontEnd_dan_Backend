import React from 'react';
import { Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, Star, User, FolderOpen, Tag, Calendar } from 'lucide-react';

const ArticlesTable = ({ articles, loading, onEdit, onDelete, onToggleStatus }) => {
  const getStatusLabel = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Archived
          </span>
        );
      default:
        return status;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Daftar Article</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Daftar Article</h3>
      </div>

      {articles.length === 0 ? (
        <div className="p-6 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada article</h3>
          <p className="mt-1 text-sm text-gray-500">
            Mulai dengan membuat article pertama Anda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penulis & Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  {/* Article Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-4">
                      {/* Featured Image */}
                      <div className="flex-shrink-0 h-16 w-16">
                        {article.featuredImage ? (
                          <img
                            className="h-16 w-16 rounded-lg object-cover"
                            src={article.featuredImage}
                            alt={article.title}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Article Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {article.title}
                          </p>
                          {article.isFeatured && (
                            <Star className="ml-2 h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        {article.excerpt && (
                          <p className="text-sm text-gray-500 mt-1">
                            {truncateText(article.excerpt, 120)}
                          </p>
                        )}
                        
                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{article.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400 mt-2">
                          ID: {article.articleId || article.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Author & Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {article.author && (
                        <div className="flex items-center text-sm text-gray-900">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {article.author}
                        </div>
                      )}
                      {article.category && (
                        <div className="flex items-center text-sm text-gray-500">
                          <FolderOpen className="h-4 w-4 mr-1 text-gray-400" />
                          {article.category}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusLabel(article.status)}
                      {article.status === 'published' && article.publishedAt && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(article.publishedAt)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Dibuat: {formatDate(article.metadata?.createdAt)}</div>
                      {article.metadata?.updatedAt && 
                        article.metadata.updatedAt !== article.metadata.createdAt && (
                        <div className="text-xs">
                          Diupdate: {formatDate(article.metadata.updatedAt)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(article)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title="Edit article"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(article)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title="Hapus article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArticlesTable; 