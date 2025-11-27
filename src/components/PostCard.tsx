import { Post } from '../types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <h2 className="post-title">{post.title}</h2>
        <div className="post-meta">
          <span className="post-author">By {post.authorName}</span>
          <span className="post-date">{formatDate(post.createdAt)}</span>
        </div>
      </div>
      <div 
        className="post-content" 
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}

