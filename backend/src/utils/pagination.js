export const getPaginationOptions = (reqQuery, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(reqQuery.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(reqQuery.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const formatPaginationMeta = (page, limit, total) => {
  return {
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total
    }
  };
};
