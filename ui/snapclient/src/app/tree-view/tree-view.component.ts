/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {FhirService} from '../_services/fhir.service';
import {Subscription} from 'rxjs';
import {SelectionService} from '../_services/selection.service';
import {ConceptNode} from '@csiro/shrimp-hierarchy-view';
import {Coding} from '../store/fhir-feature/fhir.reducer';
import {MatTreeNestedDataSource} from '@angular/material/tree';

export class Node {
  constructor(public concept: ConceptNode<Coding>,
              public isParent: boolean = false,
              public children: Node[] | null = null) {}
}

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css']
})
export class TreeViewComponent implements OnInit, OnDestroy {

  @Input() active: boolean = true;

  private subscription = new Subscription();
  private focus?: Node;

  treeControl: NestedTreeControl<Node>;
  nestedData: MatTreeNestedDataSource<Node>;

  constructor(
    private selectionService: SelectionService,
    private fhirService: FhirService
  ) {
    this.treeControl = new NestedTreeControl<Node>(this.getChildren);
    this.nestedData = new MatTreeNestedDataSource<Node>();
    this.nestedData.data = [];
  }

  getChildren = (node: Node): Node[] => {
    return node.children ?? [];
  }

  hasChild(_: number, node: Node): boolean {
    return node.children === null || node.children.length > 0;
  }

  toggle(element: Node) {
    const self = this;
    if (element.isParent) {
      // re-focus on parent node
      this.selectionService.select(element.concept.payload);
    } else if (element.children === null && element.concept.payload) {
      const {code, system, version} = element.concept.payload;
      self.fhirService.conceptHierarchy(code, system, version).subscribe(nodes => {
        element.children = nodes.filter(node =>
          node.directParents && node.directParents.indexOf(element.concept.id) >= 0
        ).map(node => {
          return new Node(node);
        });

        // Workaround for bug - see https://github.com/angular/components/issues/11381
        const tmp = self.nestedData.data;
        self.nestedData.data = [];
        self.nestedData.data = tmp;
      });
    }
  }

  ngOnInit(): void {
    const self = this;
    self.subscription.add(self.selectionService.subscribeWithCurrent({
      next(selection: any): void {
        if (self.active && selection?.code) {
          const code = selection.code;
          const system = selection.system;
          const version = selection.version ?? 'http://snomed.info/sct';
          const id = FhirService.conceptNodeId(system, code);
          const prevFocus = self.focus;

          if (prevFocus?.concept.id === id) {
            // no change; nothing to do
            return;
          }

          self.fhirService.conceptHierarchy(code, system, version).subscribe(nodes => {
            const roots: Node[] = [];
            const focus = nodes.find(node => code === node.payload?.code && system === node.payload?.system);
            if (!focus) return;
            const focusChildren: Node[] = [];

            nodes.forEach(node => {
              let newNode: Node;
              if (prevFocus && prevFocus.concept.id === node.id) {
                newNode = prevFocus;
              } else {
                newNode = new Node(node);
              }

              if ((node.directParents ?? []).indexOf(focus.id) >= 0) {
                newNode.isParent = false;
                focusChildren.push(newNode);
              } else if ((focus.directParents ?? []).indexOf(node.id) >= 0) {
                newNode.isParent = true;
                roots.push(newNode);
              }
            });

            const focusNode = new Node(focus, false, focusChildren);
            const lastRoot = roots[roots.length-1];

            self.nestedData.data = [];  // Workaround for bug - see https://github.com/angular/components/issues/11381
            if (lastRoot) {
              lastRoot.children = [focusNode];
              self.nestedData.data = roots;
            } else {
              self.nestedData.data = [focusNode];
            }

            self.treeControl.expand(focusNode);
            if (lastRoot) {
              self.treeControl.expand(lastRoot);
            }

            self.focus = focusNode;
          });
        }
      },
      error(error): void {console.error('Selection error', error);}
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private update(): void {
  }

}
