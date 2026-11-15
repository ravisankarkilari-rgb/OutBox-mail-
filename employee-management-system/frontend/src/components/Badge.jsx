import React from 'react';

export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variants[variant] || variants.gray
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="green">Active</Badge>;
    case 'INACTIVE':
      return <Badge variant="gray">Inactive</Badge>;
    case 'ON_LEAVE':
      return <Badge variant="yellow">On Leave</Badge>;
    case 'TERMINATED':
      return <Badge variant="red">Terminated</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

export const EmailStatusBadge = ({ status }) => {
  switch (status) {
    case 'SENT':
      return <Badge variant="green">Delivered</Badge>;
    case 'SCHEDULED':
      return <Badge variant="yellow">Scheduled</Badge>;
    case 'SENDING':
      return <Badge variant="blue">Sending...</Badge>;
    case 'FAILED':
      return <Badge variant="red">Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="gray">Cancelled</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

export const RatingBadge = ({ rating }) => {
  switch (rating) {
    case 'EXCELLENT':
      return <Badge variant="green">Excellent</Badge>;
    case 'GOOD':
      return <Badge variant="blue">Good</Badge>;
    case 'AVERAGE':
      return <Badge variant="yellow">Average</Badge>;
    case 'BELOW_AVERAGE':
    case 'POOR':
      return <Badge variant="red">{rating.replace('_', ' ')}</Badge>;
    default:
      return <Badge variant="gray">{rating}</Badge>;
  }
};

