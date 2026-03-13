import { describe, it, expect } from 'vitest';
import {
  profileKeys,
  subscriptionKeys,
  evaluationKeys,
  patientKeys,
  inventoryKeys,
  dashboardKeys,
  resultKeys,
  groupResultKeys,
  referralKeys,
  signedUrlKey,
  pendingTeethKeys,
  onboardingKeys,
} from '../query-keys';

describe('profileKeys', () => {
  it('all returns base key', () => {
    expect(profileKeys.all).toEqual(['profile']);
  });
  it('detail returns key with userId', () => {
    expect(profileKeys.detail('u1')).toEqual(['profile', 'u1']);
  });
  it('payments returns key with userId', () => {
    expect(profileKeys.payments('u1')).toEqual(['payment-history', 'u1']);
  });
});

describe('subscriptionKeys', () => {
  it('all returns base key', () => {
    expect(subscriptionKeys.all).toEqual(['subscription']);
  });
  it('detail returns key with userId', () => {
    expect(subscriptionKeys.detail('u1')).toEqual(['subscription', 'u1']);
  });
  it('detail returns key with undefined userId', () => {
    expect(subscriptionKeys.detail()).toEqual(['subscription', undefined]);
  });
  it('plans returns key', () => {
    expect(subscriptionKeys.plans()).toEqual(['subscription-plans']);
  });
  it('creditCosts returns key', () => {
    expect(subscriptionKeys.creditCosts()).toEqual(['credit-costs']);
  });
  it('creditPacks returns key', () => {
    expect(subscriptionKeys.creditPacks()).toEqual(['credit-packs']);
  });
  it('creditUsage returns key with userId', () => {
    expect(subscriptionKeys.creditUsage('u1')).toEqual(['credit-usage', 'u1']);
  });
  it('creditUsage returns key without userId', () => {
    expect(subscriptionKeys.creditUsage()).toEqual(['credit-usage', undefined]);
  });
});

describe('evaluationKeys', () => {
  it('all returns base key', () => {
    expect(evaluationKeys.all).toEqual(['evaluations']);
  });
  it('lists returns hierarchical key', () => {
    expect(evaluationKeys.lists()).toEqual(['evaluations', 'list']);
  });
  it('sessions returns hierarchical key', () => {
    expect(evaluationKeys.sessions()).toEqual(['evaluations', 'sessions']);
  });
  it('session returns key with id', () => {
    expect(evaluationKeys.session('s1')).toEqual(['evaluations', 'sessions', 's1']);
  });
  it('details returns hierarchical key', () => {
    expect(evaluationKeys.details()).toEqual(['evaluations', 'detail']);
  });
  it('detail returns key with id', () => {
    expect(evaluationKeys.detail('d1')).toEqual(['evaluations', 'detail', 'd1']);
  });
});

describe('patientKeys', () => {
  it('all returns base key', () => {
    expect(patientKeys.all).toEqual(['patients']);
  });
  it('lists returns hierarchical key', () => {
    expect(patientKeys.lists()).toEqual(['patients', 'list']);
  });
  it('allWithStats returns key with userId', () => {
    expect(patientKeys.allWithStats('u1')).toEqual(['patients', 'all-with-stats', 'u1']);
  });
  it('autocomplete returns key with userId', () => {
    expect(patientKeys.autocomplete('u1')).toEqual(['patients', 'autocomplete', 'u1']);
  });
  it('details returns hierarchical key', () => {
    expect(patientKeys.details()).toEqual(['patients', 'detail']);
  });
  it('detail returns key with id', () => {
    expect(patientKeys.detail('p1')).toEqual(['patients', 'detail', 'p1']);
  });
  it('sessions returns key with id and page', () => {
    expect(patientKeys.sessions('p1', 2)).toEqual(['patients', 'detail', 'p1', 'sessions', 2]);
  });
});

describe('inventoryKeys', () => {
  it('all returns base key', () => {
    expect(inventoryKeys.all).toEqual(['inventory']);
  });
  it('list returns key with page', () => {
    expect(inventoryKeys.list(1)).toEqual(['inventory', 'list', 1]);
  });
  it('allItems returns key with userId', () => {
    expect(inventoryKeys.allItems('u1')).toEqual(['inventory', 'all', 'u1']);
  });
  it('catalog returns key', () => {
    expect(inventoryKeys.catalog()).toEqual(['inventory', 'catalog']);
  });
});

describe('dashboardKeys', () => {
  it('all returns key with userId', () => {
    expect(dashboardKeys.all('u1')).toEqual(['dashboard', 'u1']);
  });
  it('metrics returns hierarchical key', () => {
    expect(dashboardKeys.metrics('u1')).toEqual(['dashboard', 'u1', 'metrics']);
  });
  it('counts returns hierarchical key', () => {
    expect(dashboardKeys.counts('u1')).toEqual(['dashboard', 'u1', 'counts']);
  });
  it('insights returns hierarchical key', () => {
    expect(dashboardKeys.insights('u1')).toEqual(['dashboard', 'u1', 'insights']);
  });
});

describe('resultKeys', () => {
  it('detail returns key', () => {
    expect(resultKeys.detail('r1')).toEqual(['result', 'r1']);
  });
  it('photos returns key', () => {
    expect(resultKeys.photos('r1')).toEqual(['result-photos', 'r1']);
  });
  it('dsdUrl returns key', () => {
    expect(resultKeys.dsdUrl('r1')).toEqual(['result-dsd-url', 'r1']);
  });
  it('dsdLayers returns key', () => {
    expect(resultKeys.dsdLayers('r1')).toEqual(['result-dsd-layers', 'r1']);
  });
});

describe('groupResultKeys', () => {
  it('detail returns key', () => {
    expect(groupResultKeys.detail('s1')).toEqual(['group-result', 's1']);
  });
  it('photo returns key', () => {
    expect(groupResultKeys.photo('path/to/photo')).toEqual(['group-photo', 'path/to/photo']);
  });
  it('photo returns key with undefined', () => {
    expect(groupResultKeys.photo(undefined)).toEqual(['group-photo', undefined]);
  });
  it('dsdUrl returns key', () => {
    expect(groupResultKeys.dsdUrl('e1')).toEqual(['group-dsd-url', 'e1']);
  });
  it('dsdLayers returns key', () => {
    expect(groupResultKeys.dsdLayers('e1')).toEqual(['group-dsd-layers', 'e1']);
  });
});

describe('referralKeys', () => {
  it('code returns key', () => {
    expect(referralKeys.code('u1')).toEqual(['referral-code', 'u1']);
  });
  it('stats returns key', () => {
    expect(referralKeys.stats('u1')).toEqual(['referral-stats', 'u1']);
  });
});

describe('signedUrlKey', () => {
  it('returns key with bucket and path', () => {
    expect(signedUrlKey('bucket', 'path')).toEqual([
      'signed-url', 'bucket', 'path', 0, 0, 0, '',
    ]);
  });
  it('returns key with thumbnail options', () => {
    expect(signedUrlKey('bucket', 'path', { width: 100, height: 200, quality: 80, resize: 'cover' })).toEqual([
      'signed-url', 'bucket', 'path', 100, 200, 80, 'cover',
    ]);
  });
  it('returns key with partial thumbnail options', () => {
    expect(signedUrlKey('bucket', 'path', { width: 50 })).toEqual([
      'signed-url', 'bucket', 'path', 50, 0, 0, '',
    ]);
  });
});

describe('pendingTeethKeys', () => {
  it('session returns key', () => {
    expect(pendingTeethKeys.session('s1')).toEqual(['pendingTeeth', 's1']);
  });
});

describe('onboardingKeys', () => {
  it('progress returns key with userId', () => {
    expect(onboardingKeys.progress('u1')).toEqual(['onboarding-progress', 'u1']);
  });
  it('progress returns key without userId', () => {
    expect(onboardingKeys.progress()).toEqual(['onboarding-progress', undefined]);
  });
});
