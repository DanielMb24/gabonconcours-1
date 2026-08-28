import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DocumentsContinue = () => {
  const { nupcan } = useParams<{ nupcan: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedNupcan = decodeURIComponent(nupcan || '').trim().toUpperCase();
    if (!normalizedNupcan) {
      navigate('/connexion', { replace: true });
      return;
    }

    navigate(`/documents/${encodeURIComponent(normalizedNupcan)}`, { replace: true });
  }, [navigate, nupcan]);

  return null;
};

export default DocumentsContinue;
