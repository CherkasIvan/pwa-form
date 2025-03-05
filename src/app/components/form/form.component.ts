import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
} from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzCheckboxModule,
    NzButtonModule,
  ],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  form: FormGroup;
  cacheName = 'form-data-cache';
  isVisible = false;

  constructor(private fb: FormBuilder, private modal: NzModalService) {
    this.form = this.fb.group({
      name: [''],
      selectOption: ['option1'],
      agree: [false],
    });
  }

  ngOnInit() {
    this.checkForCachedData();
    this.form.valueChanges.subscribe((value: any) => {
      console.log('Form value changed:', value);
      this.saveData(value);
    });
  }

  checkForCachedData() {
    if ('serviceWorker' in navigator) {
      caches.open(this.cacheName).then((cache) => {
        cache.match('formData').then((response) => {
          if (response) {
            response.json().then((data) => {
              if (Object.keys(data).length > 0) {
                this.isVisible = true;
              }
            });
          }
        });
      });
    }
  }

  handleCancel(): void {
    this.isVisible = true;
  }

  loadCachedData() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'FORM_DATA') {
              console.log('Loaded data from cache:', event.data.payload);
              this.form.patchValue(event.data.payload);
            }
            this.isVisible = false;
          };
          console.log('Sending GET_FORM_DATA message to Service Worker...');
          registration.active?.postMessage(
            {
              type: 'GET_FORM_DATA',
            },
            [messageChannel.port2]
          );
        });
      });
    }
  }

  clearCache() {
    if (navigator.serviceWorker) {
      caches.open(this.cacheName).then((cache) => {
        cache.delete('formData').then(() => {
          console.log('Cache cleared.');
          this.isVisible = false;
        });
      });
    }
  }

  saveData(value: any) {
    console.log('Attempting to save data:', value);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.active) {
            console.log('Sending SAVE_FORM_DATA message to Service Worker...');
            registration.active.postMessage({
              type: 'SAVE_FORM_DATA',
              payload: value,
            });
          } else {
            console.log('No active Service Worker registration found.');
          }
        });
      });
    }
  }

  checkCache() {
    console.log('Checking cache...');
    caches
      .open(this.cacheName)
      .then((cache) => {
        cache
          .match('formData')
          .then((response) => {
            if (response) {
              this.isVisible = true;
              response.json().then((data) => {
                console.log('Cached data:', data);
              });
            } else {
              console.log('No cached data found.');
            }
          })
          .catch((err) => {
            console.error('Error checking cache:', err);
          });
      })
      .catch((err) => {
        console.error('Error opening cache:', err);
      });
  }
}
