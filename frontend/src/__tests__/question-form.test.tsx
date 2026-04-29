import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { QuestionForm } from '../components/QuestionForm';


describe('QuestionForm', () => {
  it('submits typed question', () => {
    const onSubmit = vi.fn();
    render(<QuestionForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('질문'), { target: { value: '영업정지 줄일 수 있어?' } });
    fireEvent.click(screen.getByText('근거 찾기'));
    expect(onSubmit).toHaveBeenCalledWith('영업정지 줄일 수 있어?');
  });
});
