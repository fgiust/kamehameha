import type { DiffUnitOp } from 'tenshindiff';
import { formatDiffPlainText, renderDiffHtml } from 'tenshindiff';
import CopyablePlainText from './CopyablePlainText';

interface Props {
  ops: DiffUnitOp[];
  className?: string;
  style?: React.CSSProperties;
}

export default function DiffDisplay({ ops, className = '', style }: Props) {
  return (
    <CopyablePlainText
      plainText={formatDiffPlainText(ops)}
      className={`diff-display ${className}`.trim()}
      style={style}
    >
      <span dangerouslySetInnerHTML={{ __html: renderDiffHtml(ops, { wrap: false }) }} />
    </CopyablePlainText>
  );
}
