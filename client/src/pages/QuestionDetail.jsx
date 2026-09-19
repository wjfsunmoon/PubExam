import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionApi } from '../api';
import AnalysisView from '../components/AnalysisView';

export default function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    questionApi
      .get(id)
      .then(({ data }) => setQuestion(data))
      .catch((err) => setError(err.response?.data?.error || '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center text-gray-400 py-12">加载中...</div>;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">{error}</p>
        <Link to="/bank" className="text-brand-600 text-sm hover:underline">
          ← 返回题库
        </Link>
      </div>
    );
  if (!question) return null;

  return (
    <div className="space-y-4">
      <Link to="/bank" className="text-sm text-brand-600 hover:text-brand-700 inline-block">
        ← 返回题库
      </Link>
      <AnalysisView question={question} />
    </div>
  );
}
