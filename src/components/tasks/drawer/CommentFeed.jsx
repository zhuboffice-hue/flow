import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { initialCommentState } from '../../../lib/models';
import Button from '../../ui/Button';
import TextArea from '../../ui/TextArea';
import Avatar from '../../ui/Avatar';
import Icon from '../../ui/Icon';

const CommentFeed = ({ taskId, projectId }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!taskId || !projectId) return;

        const q = query(collection(db, 'projects', projectId, 'tasks', taskId, 'comments'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [taskId, projectId]);

    const handlePostComment = async () => {
        if (!newComment.trim() || !currentUser) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'projects', projectId, 'tasks', taskId, 'comments'), {
                ...initialCommentState,
                taskId,
                text: newComment,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                authorAvatar: currentUser.photoURL,
                createdAt: new Date()
            });
            setNewComment('');
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6 p-1">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                        <p>No comments yet.</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <Avatar
                                size="sm"
                                src={comment.authorAvatar}
                                fallback={comment.authorName?.charAt(0)}
                            />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-text-primary">
                                        {comment.authorName || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {comment.createdAt?.toDate().toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-sm text-text-secondary bg-surface-secondary p-3 rounded-md rounded-tl-none">
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <TextArea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="mb-2"
                />
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button className="text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary">
                            <Icon name="Paperclip" size={16} />
                        </button>
                        <button className="text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary">
                            <Icon name="Smile" size={16} />
                        </button>
                    </div>
                    <Button size="sm" onClick={handlePostComment} disabled={loading || !newComment.trim()}>
                        Post Comment
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CommentFeed;
