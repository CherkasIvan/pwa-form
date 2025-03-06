import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { JsonPipe, NgIf } from '@angular/common';
import { ChangeDetectorRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzCheckboxModule,
    NzButtonModule,
    NgIf,
    JsonPipe,
  ],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  form: FormGroup;
  cacheName = 'form-data-cache';
  isVisible = false;
  private isClearingCache = false;
  cachedData: any = null;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: [''],
      selectOption: ['option1'],
      agree: [false],
    });
  }

  showModal(): void {
    this.isVisible = true;
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.loadCachedData();
    this.isVisible = false;
  }

  handleCancel(): void {
    console.log('Clearing form and removing cached data...');

    // Сбрасываем форму
    this.form.reset({
      name: '',
      selectOption: 'option1',
      agree: false,
    });

    if ('caches' in window) {
      caches
        .open(this.cacheName)
        .then((cache) => {
          cache.delete('/browser/formData').then((wasDeleted) => {
            if (wasDeleted) {
              console.log(
                'Object "/browser/formData" was successfully deleted.'
              );
            } else {
              console.log(
                'Object "/browser/formData" was not found in the cache.'
              );
            }

            this.zone.run(() => {
              this.cachedData = null;
            });
          });
        })
        .catch((err) => console.error('Error clearing cache:', err));
    } else {
      console.error('Caches API is not available in this environment.');
    }

    this.isVisible = false;
  }

  ngOnInit(): void {
    this.checkCache();
    this.form.valueChanges.subscribe((value) => {
      this.saveData(value);
    });
  }

  checkCache(): void {
    console.log('Checking cache...');
    if ('caches' in window) {
      caches
        .open(this.cacheName)
        .then((cache) => {
          cache.match('/browser/formData').then((response) => {
            if (response) {
              response.json().then((data) => {
                this.cachedData = data;
                console.log('Cached data found:', this.cachedData);
                this.cdr.detectChanges();
              });
            } else {
              console.log('No cached data found.');
              this.cachedData = null;
              this.cdr.detectChanges();
            }
          });
        })
        .catch((err) => console.error('Error opening cache:', err));
    }
  }

  // clearCache(): void {
  //   if ('caches' in window) {
  //     caches
  //       .open(this.cacheName)
  //       .then((cache) => {
  //         cache.delete('/browser/formData').then((wasDeleted) => {
  //           if (wasDeleted) {
  //             console.log(
  //               'Object "/browser/formData" was successfully deleted.'
  //             );
  //           } else {
  //             console.log(
  //               'Object "/browser/formData" was not found in the cache.'
  //             );
  //           }
  //           this.cachedData = null;
  //           this.cdr.detectChanges();
  //         });
  //       })
  //       .catch((err) => {
  //         console.error('Error opening cache:', err);
  //       });
  //   } else {
  //     console.error('Caches API is not available in this environment.');
  //   }
  // }

  loadCachedData(): void {
    if (this.cachedData) {
      this.form.patchValue(this.cachedData);
      console.log('Form data loaded from cache:', this.cachedData);
      this.isVisible = false;
    }
  }

  saveData(value: any): void {
    if (this.isClearingCache) {
      console.log('Skipping save operation during cache clearing.');
      return;
    }

    console.log('Attempting to save data:', value);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.active) {
            registration.active.postMessage({
              type: 'SAVE_FORM_DATA',
              payload: value,
            });
            console.log('Data saved to Service Worker cache:', value);
          }
        });
      });
    }
  }
}
