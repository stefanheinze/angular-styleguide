/*
 * SPDX-FileCopyrightText: (c) 2023 Carl Zeiss AG
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from '@playwright/test';
import { ProductMasterPage } from './page-objects/product-master.po';
import { ProductDetailPage } from './page-objects/product-detail.po';

test.describe('Product master page', () => {
  let masterPage: ProductMasterPage;
  let detailPage: ProductDetailPage;

  test.beforeEach(async ({ page }) => {
    masterPage = new ProductMasterPage(page);
    detailPage = new ProductDetailPage(page);

    await masterPage.navigateTo();
  });

  test(
    'should display title',
    {
      annotation: [{ type: 'Requirement', description: 'Requirement/Specification-Reference-001' }],
    },
    async () => {
      expect(await masterPage.getTitle()).toEqual('GET YOUR ICE CREAM');
    },
  );

  test(
    'should navigate to correct detail page when product was clicked',
    {
      annotation: [
        { type: 'Requirement', description: 'Requirement/Specification-Reference-001' },
        { type: 'Requirement', description: 'Requirement/Specification-Reference-002' },
      ],
    },
    async () => {
      const productName = 'Mint';
      const productImage = await masterPage.getProductImageByName(productName);

      await productImage?.click();

      expect(await detailPage.getTitle()).toEqual(productName);
    },
  );
});
