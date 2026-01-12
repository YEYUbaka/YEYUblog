// 评论系统前端脚本
(function() {
  'use strict';

  const config = window.commentsConfig || {};
  const apiUrl = config.apiUrl || 'http://localhost:3001';
  const postId = config.postId || window.location.pathname;
  const postTitle = config.postTitle || document.title;

  // DOM 元素
  const commentForm = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');
  const commentNameInput = document.getElementById('commentName');
  const commentContentInput = document.getElementById('commentContent');
  const charCountSpan = document.getElementById('charCount');
  const submitBtn = document.getElementById('submitBtn');

  // 字符计数
  if (commentContentInput && charCountSpan) {
    commentContentInput.addEventListener('input', function() {
      charCountSpan.textContent = this.value.length;
    });
  }

  // 加载评论
  async function loadComments() {
    const loadingEl = commentsList.querySelector('.loading');
    const noCommentsEl = commentsList.querySelector('.no-comments');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (noCommentsEl) noCommentsEl.style.display = 'none';

    try {
      const response = await fetch(`${apiUrl}/api/comments?postId=${encodeURIComponent(postId)}`);
      const data = await response.json();

      if (loadingEl) loadingEl.style.display = 'none';

      if (data.success && data.comments && data.comments.length > 0) {
        renderComments(data.comments);
      } else {
        if (noCommentsEl) noCommentsEl.style.display = 'block';
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      if (loadingEl) loadingEl.style.display = 'none';
      if (noCommentsEl) noCommentsEl.style.display = 'block';
    }
  }

  // 渲染评论列表
  function renderComments(comments) {
    const noCommentsEl = commentsList.querySelector('.no-comments');
    if (noCommentsEl) noCommentsEl.style.display = 'none';

    // 清空现有评论（保留加载和空状态元素）
    const existingComments = commentsList.querySelectorAll('.comment-item');
    existingComments.forEach(el => el.remove());

    comments.forEach(comment => {
      const commentEl = createCommentElement(comment);
      commentsList.appendChild(commentEl);
    });
  }

  // 创建评论元素
  function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';

    const avatarText = comment.name.charAt(0).toUpperCase();
    const locationText = comment.location || '未知';
    const timeText = formatTime(comment.createdAt);

    div.innerHTML = `
      <div class="comment-header">
        <div class="comment-author">
          <div class="comment-avatar">${avatarText}</div>
          <div class="comment-info">
            <div class="comment-name">${escapeHtml(comment.name)}</div>
            <div class="comment-meta">
              <span class="comment-location">${escapeHtml(locationText)}</span>
              <span class="comment-time">${timeText}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="comment-content">${escapeHtml(comment.content)}</div>
    `;

    return div;
  }

  // 格式化时间
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  }

  // HTML 转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 显示消息
  function showMessage(message, type) {
    const existingMsg = commentsList.parentElement.querySelector(`.comment-${type}`);
    if (existingMsg) {
      existingMsg.remove();
    }

    const msgEl = document.createElement('div');
    msgEl.className = `comment-${type} show`;
    msgEl.textContent = message;
    commentsList.parentElement.insertBefore(msgEl, commentsList);

    setTimeout(() => {
      msgEl.classList.remove('show');
      setTimeout(() => msgEl.remove(), 300);
    }, 3000);
  }

  // 提交评论
  if (commentForm) {
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const name = commentNameInput.value.trim();
      const content = commentContentInput.value.trim();

      if (!name || !content) {
        showMessage('请填写昵称和评论内容', 'error');
        return;
      }

      // 禁用提交按钮
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';

      try {
        const response = await fetch(`${apiUrl}/api/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: postId,
            postTitle: postTitle,
            name: name,
            content: content
          })
        });

        const data = await response.json();

        if (data.success) {
          showMessage('评论发表成功！', 'success');
          commentForm.reset();
          if (charCountSpan) charCountSpan.textContent = '0';
          
          // 重新加载评论
          setTimeout(() => {
            loadComments();
          }, 500);
        } else {
          showMessage(data.error || '评论发表失败，请稍后重试', 'error');
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        showMessage('网络错误，请检查评论服务器是否运行', 'error');
      } finally {
        // 恢复提交按钮
        submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    });
  }

  // 页面加载时获取评论
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComments);
  } else {
    loadComments();
  }
})();

