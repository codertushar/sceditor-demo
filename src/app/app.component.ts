import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import SCEditor from 'sceditor/src/lib/sceditor.js';

declare var sceditor: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'sceditor-demo';
  isInEditMode = false;
  htmlText: SafeHtml = '';
  bbCodeInputText =
    '[b]BBCode SCEditor[/b]\n' +
    'Give it a try! :)\n' +
    '[color=#ff0000]Red text! [/color][color=#3399ff]Blue?[/color]' +
    '[list=s]' +
    '[*]A simple list[/*]' +
    '[*]list item 2[/*]' +
    '[/list]' +
    '[doclink=XwBsjPnqiEfYOxhHWr7DgUy0o9ZRV1Lz]Step-by-step guide[/doclink]\n' +
    '[email=tushar.khanna@catalystone.com]Tushar Khanna Email[/email]\n' +
    '[url=https://passion.cloud.catalystone.com/]Google Hyperlink[/url]';

  private currentEditorInstance: any;
  private SCEDITOR = sceditor;
  @ViewChild('textArea') textAreaRef: ElementRef;

  constructor(private sanitizer: DomSanitizer, private renderer: Renderer2, private elementRef: ElementRef) {

  }

  ngOnInit() {
    this.setHTMLforViewMode();

    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        this.handleAnchorClick(event);
      }
    });
  }

  ngAfterViewInit() {
    // setTimeout(() => {
    this.configureScEditor();
    this.initiateScEditor();
    // }, 1000);
  }

  public handleAnchorClick(event: Event) {
    // Prevent opening anchors the default way
    event.preventDefault();
    const anchor = event.target as HTMLAnchorElement;
    const docLinkValue = anchor.outerHTML.indexOf('openDocLink(');
    if (anchor.outerHTML.includes('openDocLink')) {
      const docLinkId = anchor.getAttribute('data-doc-link');

    }
  }

  toggleMode(): void {
    this.isInEditMode = !this.isInEditMode;
    if (!this.isInEditMode) {
      this.setHTMLforViewMode();
    }
  }

  private setHTMLforViewMode(): void {
    if (this.textAreaRef) {
      this.bbCodeInputText = this.SCEDITOR.instance(this.textAreaRef.nativeElement).val();
    }
    const htmlString = this.translateBBCodeToHtml(this.bbCodeInputText, true);
    this.htmlText = this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  private initiateScEditor(): void {
    const textarea = (this.textAreaRef.nativeElement as HTMLElement);
    this.SCEDITOR.create(textarea, {
      format: 'bbcode',
      emoticonsEnabled: false,
      // enablePasteFiltering: true,
      runWithoutWysiwygSupport: false,
      // startInSourceMode: isIE11 ? true : false, // To fix an crash in IE11
      autofocus: true,
      // Use themes/content/default.min.css to style the content
      // style: 'http://localhost:4700/E:\\programming\\sceditor-demo/src\\styles.scss',
      toolbar: 'bold,italic,underline,color|bulletlist,orderedlist|link,email,image|source,maximize',
    });
    this.currentEditorInstance = sceditor.instance(textarea);

  }

  private translateBBCodeToHtml(str, alsoLineBreaks): string {
    str = str.replace(/javascript[\t\n\r]*:/gi, 'javascript%3A'); // Get rid of any harmful script attempts!
    str = str.replace(/expression\(/gi, 'expression%28'); // ..and via expression

    str = str.replace(/</g, '&lt;'); // Make sure < and > are encoded
    str = str.replace(/>/g, '&gt;');

    /*
    // [size]
    str = str.replace(
      "/\\[size=['\"]?([0-9]|[1-2][0-9])['\"]?\\](.*?)\\[/size\\]/g",
      "<span style='font-size:$1px'>$2</span>");
    */

    // [color]

    str = str.replace(/\[color=[\'\"]?(.*?[^\'\"])[\'\"]?\]/gi, '<span style=\'color:$1\'>');
    str = str.replace(/\[\/color\]/gi, '</span>');

    // [b][u][i]
    str = str.replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<b>$1</b>');
    str = str.replace(/\[u\]([\s\S]*?)\[\/u\]/g, '<u>$1</u>');
    str = str.replace(/\[i\]([\s\S]*?)\[\/i\]/g, '<i>$1</i>');

    // [img] - supports attributes width, height, align and border

    if (str.indexOf('randomkey') != -1) {
      const regex = /\[img((?:\s+(?:(?:width|height)=\d+|align=(?:left|right)|style=(?:.*?)|((?:randomkey=\w+))|border=(?:0|1)))*)\s*\](.*?)\[\/img\]/gmi;

      str = str.replace(regex, function (match, group1, group2, group3) {

        if (arguments[2] != undefined) {
          const imageSrc = 'src="catalystone.document.ShowDocumentImage?' + group2 + '&randomId=' + Math.random() + '"';
          return '<img class=\'img-fluid\'' + imageSrc + group1 + '>';
        }
        else {
          const imgSrc = 'src="' + group3 + '"';
          return '<img class=\'img-fluid\'' + imgSrc + group1 + '>';
        }
      });
    }
    else {
      const regex = /\[img((?:\s+(?:(?:width|height)=\d+|align=(?:left|right)|style=(?:.*?)|border=(?:0|1)))*)\s*\](.*?)\[\/img\]/gmi;
      str = str.replace(regex, '<img src="$2" $1>');
    }

    // [url]
    // str = str.replace(/\[url\](.*?)\[\/url\]/g,
    //   '<a class=\'link\' href=\'$1\' target=\'_blank\'>$1</a>');

    // str = str.replace(/\[url=[\'\"]?(.*?[^\'\"])[\'\"]?\](.*?)\[\/url\]/g,
    //   '<a class="link" href="$1" target="_new">$2</a>');

    // Document upload
    str = str.replace(/\[docLink\](.*?)\[\/docLink\]/gi,
      '<a class=\'link\' (click)="openDocLink(\'$1\'); return false;" target="_blank" href="">$1</a>');

    str = str.replace(/\[docLink=[\'\"]?(.*?[^\'\"])[\'\"]?\](.*?)\[\/docLink\]/gi,
      '<a class="link" (click)="openDocLink(\'$1\'); return false;" target="_new" href="">$2</a>');

    // [email]
    str = str.replace(/\[email\](.*?)\[\/email\]/g,
      '<a class=\'link\' href=\'mailto:$1\'>$1</a>');

    // Extension to the [email] "standard" where you can have an e-mail address AND a name:
    str = str.replace(/\[email=[\'\"]?(.*?[^\'\"])[\'\"]?\](.*?)\[\/email\]/g,
      '<a class="link" href="mailto:$1">$2</a>');

    // [list=s] - Currently, nested lists are not supported:

    str = str.replace(/\[list(=s)?\]([\s\S]*?)\[\/list\]/g,
      '<ul class=\'textEdit_bullets\'>$2</ul>');

    str = str.replace(/\[list=1\]([\s\S]*?)\[\/list\][\n\r]{0,2}/g,
      '<ol class=\'textEdit_decimal\'>$1</ol>');



    str = str.replace(/\s*\[\*]([\s\S]*?)\[\/\*\]\s*/g,
      '<li class=\'onStyle\'>$1</li>');

    if (alsoLineBreaks) // Replace all \n with <br> tags
    {
      str = str.replace(/\n/g, '<br>');
    }

    return str;
  }

  // function to download the doc
  openDocLink(sID) {
    const ajaxUrl = 'catalystone.wizard.DocumentsGet?ajaxCall=1&userAction=2&documentid=' + sID;
    const url = 'catalystone.wizard.DocumentsGet?ajaxCall=0';

    // $.post(ajaxUrl, function (data) {		//this is a call to check if the document requested for is not deleted

    //   if (data == '0') // if deleted
    //     CommonUtils.alert(TextEditPlugin.language["documentRemoved"]);
    //   else
    //     redirectToUrl(url + "&randomId=" + data);
    // });
  }

  private configureScEditor() {
    // ----------------------------------------------------------------------------
    //   Changing implementation for list to use [list] instead of [ul] and [ol]
    // ----------------------------------------------------------------------------
    this.SCEDITOR.formats.bbcode
      .set('list', {
        html(element, attrs, content) {
          const type = (attrs.defaultattr === '1' ? 'ol' : 'ul');

          return '<' + type + '>' + content + '</' + type + '>';
        },
        breakAfter: false
      })
      .set('ul', {
        format($elm, content) {
          return '[list=s]' + content + '[/list]';
        }
      })
      .set('ol', { format($elm, content) { return '[list=1]' + content + '[/list]'; } })
      .set('li', { format($elm, content) { return '[*]' + content + '[/*]'; } })
      .set('url', {
        tags: { a: { class: ['bbcode-url'] } }, // <font color="red">My text</font>
        format(element, content) {
          const url = element.getAttribute('href');
          const urlName = content.split('[url', 1)[0];
          content = content.replace(urlName, '');
          if (url == content) { // If content and URL is the same, then we can keep it a plain [url] tag
            return '[url]' + urlName + '[/url]' + content;
          }
          else {
            return '[url=' + element.getAttribute('href') + ']' + urlName + '[/url]' + content;
          }
        },
        html(token, attrs, content) {
          let url = content;

          if (typeof attrs.defaultattr !== 'undefined') {
            url = attrs.defaultattr;
          }

          return '<a class="bbcode-url" href="' + url + '" target="_blank">' + content + '</a>';
        }
      })
      .set('doclink', {
        tags: { a: { class: ['bbcode-doclink'] } }, // <font color="red">My text</font>
        format(element, content) {
          const docId = element.getAttribute('_docid');
          const docName = content.split('[doclink=', 1)[0];
          content = content.replace(docName, '');
          return '[doclink=' + docId + ']' + docName + '[/doclink]' + content;
        },
        html(token, attrs, content) {
          if (typeof attrs.defaultattr !== 'undefined') {
            return '<a class="bbcode-doclink" href="javascript:void(0)" onclick="return false" _docid="' +
              attrs.defaultattr + '">' + content + '</a>';
          }
          else {
            return content;
          } // Return just the content if the id is missing (default attribute id, [docLink=<id>])
        }
      })
      .set('email', {
        tags: { a: { class: ['bbcode-email'] } }, // <font color="red">My text</font>
        format(element, content) {
          let email = element.getAttribute('_email');
          let emailName = content.split('[email', 1)[0];
          content = content.replace(emailName, '');
          if (email == content) { // If content and email is the same, then we can keep it a plain [email] tag
            return '[email]' + emailName + '[/email]' + content;
          }
          else {
            return '[email=' + email + ']' + emailName + '[/email]' + content;
          }
        },
        html(token, attrs, content) {
          let email = content;

          if (typeof attrs.defaultattr !== 'undefined') {
            email = attrs.defaultattr;
          }

          return '<a class="bbcode-email" href="javascript:void(0)" onclick="return false" _email="' + email + '">' + content + '</a>';
        }
      });

    this.SCEDITOR.command
      .set('bulletlist', { txtExec: ['[list=s]\n[*]', '\n[/list]'] })
      .set('orderedlist', { txtExec: ['[list=1]\n[*]', '\n[/list]'] });
  }
}
